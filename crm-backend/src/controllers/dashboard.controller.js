const {
  getFounderDashboard,
  getTeamDashboard,
  getBdeDashboard,
} = require('../services/aggregation.service');
const { exportLeadsToExcel, exportLeadsToPDF } = require('../services/export.service');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

const StateCity = require('../models/StateCity');

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.founderDashboard = async (req, res) => {
  try {
    const data = await getFounderDashboard();
    return success(res, data);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.teamDashboard = async (req, res) => {
  try {
    const data = await getTeamDashboard(req.user._id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.bdeDashboard = async (req, res) => {
  try {
    // Security fix (Section 15: "BDE dashboard - personal only"): previously
    // any authenticated user could view any BDE's stats by changing the ID
    // in the URL. Now: a BDE may only view their own; a Team Lead only their
    // own BDEs'; Founder unrestricted.
    const target = await User.findById(req.params.id).select('reportsTo role');
    if (!target) return error(res, 'User not found', 404);

    const { role, userId } = req.scope;
    const isSelf = String(target._id) === String(userId);
    const isOwnBde = role === 'team_lead' && String(target.reportsTo) === String(userId);

    if (role !== 'founder' && !isSelf && !isOwnBde) {
      return error(res, 'Forbidden: you can only view your own or your team\'s BDE dashboard', 403);
    }

    const data = await getBdeDashboard(req.params.id);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.exportReport = async (req, res) => {
  try {
    if (req.user.role === 'bde') return error(res, 'Forbidden: insufficient role', 403);

    const { format = 'excel', startDate, endDate, state, city, status, assignedTo } = req.query;
    const and = [];

    if (status) and.push({ status });

    // City: ignore letter case and stray spaces
    if (city) {
      and.push({ cityName: new RegExp(`^\\s*${escapeRegex(city.trim())}\\s*$`, 'i') });
    }

    // State: match the saved state code, OR a lead with no state saved
    // whose city belongs to that state (covers imported leads).
    if (state) {
      const stateDoc = await StateCity.findOne({
        $or: [
          { stateCode: state },
          { stateName: new RegExp(`^${escapeRegex(state.trim())}$`, 'i') },
        ],
      }).lean();

      if (stateDoc) {
        and.push({
          $or: [
            { stateCode: { $in: [stateDoc.stateCode, stateDoc.stateName] } },
            { stateCode: { $in: [null, ''] }, cityName: { $in: stateDoc.cities || [] } },
          ],
        });
      } else {
        and.push({ stateCode: state });
      }
    }

    if (startDate || endDate) {
      const range = {};
      if (startDate) range.$gte = new Date(startDate);
      if (endDate) range.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      and.push({ createdAt: range });
    }

    // Scope: a Team Lead only ever gets leads of their own BDEs
    let allowedIds = null;
    if (req.user.role === 'team_lead') {
      const bdes = await User.find({ reportsTo: req.user._id }).select('_id');
      allowedIds = bdes.map((b) => String(b._id));
    }
    if (assignedTo) {
      if (allowedIds && !allowedIds.includes(String(assignedTo))) {
        return error(res, 'Forbidden: this BDE is not in your team', 403);
      }
      and.push({ assignedTo });
    } else if (allowedIds) {
      and.push({ assignedTo: { $in: allowedIds } });
    }

    const leads = await Lead.find(and.length ? { $and: and } : {})
      .populate('assignedTo', 'name')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    if (leads.length === 0) {
      return error(res, 'No leads match these filters - nothing to export', 404);
    }

    if (format === 'pdf') return exportLeadsToPDF(leads, res);
    return exportLeadsToExcel(leads, res);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
