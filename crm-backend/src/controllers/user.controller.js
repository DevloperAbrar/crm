const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

exports.listUsers = async (req, res) => {
  try {
    const { role, userId } = req.scope;
    let query = {};

    if (role === 'team_lead') {
      query = { $or: [{ _id: userId }, { reportsTo: userId }] };
    } else if (role === 'bde') {
      query = { _id: userId };
    }
    // founder: no restriction

    // Deactivated users are intentionally still included here (not
    // filtered out) so the Team Management page can show them greyed out
    // with a "Deactivated" badge and a Reactivate option, rather than
    // having them silently vanish with no way to bring them back.
    const users = await User.find(query).select('-passwordHash');
    return success(res, users);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, role, reportsTo, assignedStates, assignedCities } = req.body;

    if (!['team_lead', 'bde'].includes(role)) {
      return error(res, 'Role must be team_lead or bde', 422);
    }

    if (req.user.role === 'team_lead' && role !== 'bde') {
      return error(res, 'Team Leads can only create BDEs', 403);
    }

    if (!name || !email) {
      return error(res, 'name and email are required', 422);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return error(res, 'A user with this email already exists', 409);
    }

    // No password: this person signs in with the Google account matching this email.
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      role,
      reportsTo: role === 'bde' ? reportsTo || req.user._id : null,
      assignedStates,
      assignedCities,
    });

    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    if (req.audit) await req.audit('user.created', 'users', user._id, null, safeUser);

    return success(res, safeUser, 'User created', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// A Team Lead may only act on their own BDE records (or themselves);
// the Founder is unrestricted. Returns true if req.user is allowed to
// modify the target user.
function canManage(req, targetUser) {
  if (req.user.role === 'founder') return true;
  if (String(targetUser._id) === String(req.user._id)) return true;
  if (req.user.role === 'team_lead' && String(targetUser.reportsTo) === String(req.user._id)) return true;
  return false;
}

exports.updateUser = async (req, res) => {
  try {
    const previous = await User.findById(req.params.id).select('-passwordHash');
    if (!previous) return error(res, 'User not found', 404);

    if (!canManage(req, previous)) {
      return error(res, 'Forbidden: you can only manage users in your own team', 403);
    }

    const updates = { ...req.body };
    delete updates.passwordHash;
    delete updates.googleId;
    delete updates.role; // role changes go through a dedicated flow
    delete updates.isActive; // activation state goes through deactivate/reactivate, not a generic field edit

    // Editing the email matters here: this person signs in with "Sign in
    // with Google" matched against this exact email, so changing it
    // changes which Google account can log in as them going forward.
    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();
      const existing = await User.findOne({ email: updates.email, _id: { $ne: req.params.id } });
      if (existing) {
        return error(res, 'Another user already uses this email', 409);
      }
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    if (req.audit) await req.audit('user.updated', 'users', updated._id, previous, updated);

    return success(res, updated, 'User updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return error(res, 'User not found', 404);

    if (!canManage(req, target)) {
      return error(res, 'Forbidden: you can only manage users in your own team', 403);
    }

    target.isActive = false;
    await target.save();

    if (req.audit) await req.audit('user.deactivated', 'users', target._id);

    return success(res, null, 'User deactivated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * Reverses deactivateUser. Previously there was no way to bring a
 * deactivated Team Lead or BDE back - the only path was direct DB access.
 */
exports.reactivateUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return error(res, 'User not found', 404);

    if (!canManage(req, target)) {
      return error(res, 'Forbidden: you can only manage users in your own team', 403);
    }

    target.isActive = true;
    await target.save();

    if (req.audit) await req.audit('user.reactivated', 'users', target._id);

    return success(res, null, 'User reactivated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.reassignTeam = async (req, res) => {
  try {
    const { newTeamLeadId } = req.body;
    if (!newTeamLeadId) return error(res, 'newTeamLeadId is required', 422);

    const previous = await User.findById(req.params.id);
    if (!previous) return error(res, 'User not found', 404);

    if (previous.role !== 'bde') {
      return error(res, 'Only BDEs can be reassigned between Team Leads', 422);
    }

    const newLead = await User.findOne({ _id: newTeamLeadId, role: 'team_lead' });
    if (!newLead) return error(res, 'Target Team Lead not found', 404);

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { reportsTo: newTeamLeadId },
      { new: true }
    ).select('-passwordHash');

    if (req.audit) {
      await req.audit(
        'user.reassignTeam',
        'users',
        updated._id,
        { reportsTo: previous.reportsTo },
        { reportsTo: newTeamLeadId }
      );
    }

    return success(res, updated, 'BDE reassigned to new Team Lead');
  } catch (err) {
    return error(res, err.message, 500);
  }
};
