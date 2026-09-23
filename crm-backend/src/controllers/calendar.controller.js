const Lead = require('../models/Lead');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

function startEndOfDay(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date.setHours(0, 0, 0, 0));
  const end = new Date(date.setHours(23, 59, 59, 999));
  return { start, end };
}

// GET /api/calendar/me - due-today + upcoming leads for the logged-in user
const CLOSED = ['Converted', 'Lost'];

// GET /api/calendar/me
// Leads assigned to me OR whose current follow-up I own (I logged the last call).
exports.myCalendar = async (req, res) => {
  try {
    const { start, end } = startEndOfDay(req.query.date);
    const mine = { $or: [{ assignedTo: req.user._id }, { followUpOwner: req.user._id }] };
    const open = { status: { $nin: CLOSED } };
    const find = (nextFollowUpDate) => Lead.find({ $and: [mine, open, { nextFollowUpDate }] })
      .populate('assignedTo', 'name');

    const [overdue, dueToday, upcoming] = await Promise.all([
      find({ $ne: null, $lt: start }).sort({ nextFollowUpDate: 1 }).limit(100),
      find({ $gte: start, $lte: end }).sort({ nextFollowUpDate: 1 }),
      find({ $gt: end }).sort({ nextFollowUpDate: 1 }).limit(50),
    ]);

    return success(res, { overdue, dueToday, upcoming });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/calendar/team
// Founder: every open follow-up in the company, including unassigned leads.
// Team Lead: follow-ups on leads assigned to their own BDEs.
exports.teamCalendar = async (req, res) => {
  try {
    const isFounder = req.user.role === 'founder';

    const people = await User.find(
      isFounder
        ? { role: { $in: ['team_lead', 'bde'] }, isActive: true }
        : { reportsTo: req.user._id, isActive: true }
    )
      .select('_id name role reportsTo')
      .sort({ role: 1, name: 1 });

    const { start, end } = startEndOfDay(req.query.date);
    const horizon = new Date(end);
    horizon.setDate(horizon.getDate() + 30);

    const scope = isFounder ? {} : { assignedTo: { $in: people.map((p) => p._id) } };
    const open = { status: { $nin: CLOSED } };
    const find = (nextFollowUpDate) =>
      Lead.find({ $and: [scope, open, { nextFollowUpDate }] }).populate('assignedTo', 'name role');

    const [overdue, dueToday, upcoming] = await Promise.all([
      find({ $ne: null, $lt: start }).sort({ nextFollowUpDate: 1 }).limit(200),
      find({ $gte: start, $lte: end }).sort({ nextFollowUpDate: 1 }).limit(200),
      find({ $gt: end, $lte: horizon }).sort({ nextFollowUpDate: 1 }).limit(200),
    ]);

    return success(res, { people, bdes: people, overdue, dueToday, upcoming });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// GET /api/calendar/streak/:userId - streak heatmap data (Section 9)
exports.getStreak = async (req, res) => {
  try {
    const Interaction = require('../models/Interaction');
    const userId = req.params.userId;

    const user = await User.findById(userId).select('dailyTarget stats');
    if (!user) return error(res, 'User not found', 404);

    // Group interactions by day for the last 90 days
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const dailyCounts = await Interaction.aggregate([
      { $match: { handledBy: user._id, date: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const heatmap = dailyCounts.map((d) => ({
      date: d._id,
      count: d.count,
      state: d.count >= user.dailyTarget ? 'complete' : d.count > 0 ? 'partial' : 'missed',
    }));

    return success(res, {
      heatmap,
      currentStreak: user.stats.currentStreak,
      longestStreak: user.stats.longestStreak,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
