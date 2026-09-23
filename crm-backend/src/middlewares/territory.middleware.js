const User = require('../models/User');

/**
 * Scopes downstream queries to a user's team/territory.
 * - Founder: no restriction (sees everything).
 * - Team Lead: restricted to leads/interactions belonging to their own BDEs.
 * - BDE: restricted to only their own assigned leads.
 *
 * Attaches req.scope = { role, userId, teamBdeIds } for controllers to use
 * when building Mongoose queries.
 */
async function territoryMiddleware(req, res, next) {
  try {
    const { role, _id } = req.user;

    if (role === 'founder') {
      req.scope = { role, userId: _id, teamBdeIds: null }; // null = unrestricted
      return next();
    }

    if (role === 'team_lead') {
      const bdes = await User.find({ reportsTo: _id }).select('_id');
      req.scope = { role, userId: _id, teamBdeIds: bdes.map((b) => b._id) };
      return next();
    }

    // BDE: only their own leads
    req.scope = { role, userId: _id, teamBdeIds: [_id] };
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Territory scoping failed: ' + err.message });
  }
}

module.exports = territoryMiddleware;
