const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

/**
 * GET /api/audit-logs
 *
 * Founder-only. Supports:
 *  - tab-based filtering: ?tab=all|founder|team_lead|bde
 *  - direct filters: ?userId=&action=&targetCollection=&dateFrom=&dateTo=&search=
 *  - pagination: ?page=&limit=
 *
 * "tab" filters by the ROLE of the user who performed the action (userId.role),
 * so the founder can flip between "My Actions", "Team Leads" and "BDEs".
 */
exports.listAuditLogs = async (req, res) => {
  try {
    const {
      tab = 'all',
      userId,
      action,
      targetCollection,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 25,
    } = req.query;

    // Resolve which userIds fall into the requested tab.
    let userIdFilter = null;

    if (userId) {
      // Explicit single-user filter (e.g. drilling into one BDE's history) wins.
      userIdFilter = [userId];
    } else if (tab !== 'all') {
      const roleMap = { founder: 'founder', team_lead: 'team_lead', bde: 'bde' };
      const role = roleMap[tab];
      if (!role) return error(res, 'Invalid tab. Use all, founder, team_lead or bde', 422);

      const usersInRole = await User.find({ role }).select('_id');
      userIdFilter = usersInRole.map((u) => u._id);
    }

    const query = {};
    if (userIdFilter) query.userId = { $in: userIdFilter };
    if (action) query.action = { $regex: action, $options: 'i' };
    if (targetCollection) query.targetCollection = targetCollection;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    let logsQuery = AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    // Free-text search across action + performer name is done post-populate
    // since Mongo can't $regex across a populated field in one query.
    if (search) {
      const allMatching = await logsQuery.clone();
      const term = search.toLowerCase();
      const filtered = allMatching.filter(
        (log) =>
          log.action?.toLowerCase().includes(term) ||
          log.userId?.name?.toLowerCase().includes(term) ||
          log.targetCollection?.toLowerCase().includes(term)
      );
      const total = filtered.length;
      const paged = filtered.slice((page - 1) * limit, page * limit);
      return success(res, { logs: paged, total, page: Number(page), limit: Number(limit) });
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await logsQuery.skip((page - 1) * limit).limit(Number(limit));

    return success(res, { logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/audit-logs/:targetCollection/:targetId
 * Full history for one record (e.g. a single lead's audit trail).
 * Handy for embedding in LeadProfilePage later if you want it there too.
 */
exports.getLogsForRecord = async (req, res) => {
  try {
    const { targetCollection, targetId } = req.params;
    const logs = await AuditLog.find({ targetCollection, targetId })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    return success(res, logs);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/audit-logs/summary
 * Small counts per role tab, so the UI can show badge counts on the tabs
 * without fetching full pages first.
 */
exports.getAuditSummary = async (req, res) => {
  try {
    const [all, founders, teamLeads, bdes] = await Promise.all([
      AuditLog.countDocuments({}),
      User.find({ role: 'founder' }).select('_id'),
      User.find({ role: 'team_lead' }).select('_id'),
      User.find({ role: 'bde' }).select('_id'),
    ]);

    const [founderCount, teamLeadCount, bdeCount] = await Promise.all([
      AuditLog.countDocuments({ userId: { $in: founders.map((u) => u._id) } }),
      AuditLog.countDocuments({ userId: { $in: teamLeads.map((u) => u._id) } }),
      AuditLog.countDocuments({ userId: { $in: bdes.map((u) => u._id) } }),
    ]);

    return success(res, { all, founder: founderCount, team_lead: teamLeadCount, bde: bdeCount });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
