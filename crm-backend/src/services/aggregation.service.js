const Lead = require('../models/Lead');
const Interaction = require('../models/Interaction');
const Deal = require('../models/Deal');
const User = require('../models/User');

const STAGE_ORDER = [
  'New',
  'Attempted Contact',
  'Contacted',
  'Interested',
  'Demo/Visit Scheduled',
  'Visited',
  'Negotiation',
  'Converted',
];

async function getFunnel(matchStage = {}) {
  const pipeline = [
    { $match: matchStage },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ];
  const results = await Lead.aggregate(pipeline);
  return results.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
}

// Adds a running "reached this stage or further" total + drop-off % vs the
// previous stage, so the UI can show where leads are actually falling out
// instead of just raw per-stage counts (which don't show funnel shape).
function buildFunnelWithDropoff(funnel) {
  // Everyone who is currently at a stage, or has moved past it, "reached"
  // that stage at some point. Lost leads are excluded from the funnel shape
  // itself but reported separately since they can drop out at any point.
  const stageCounts = STAGE_ORDER.map((stage) => funnel[stage] || 0);
  const reached = stageCounts.map((_, i) =>
    stageCounts.slice(i).reduce((sum, c) => sum + c, 0)
  );

  return STAGE_ORDER.map((stage, i) => {
    const current = reached[i];
    const previous = i === 0 ? current : reached[i - 1];
    const dropoffPct = previous > 0 ? Math.round(((previous - current) / previous) * 100) : 0;
    return {
      stage,
      count: stageCounts[i],
      reached: current,
      dropoffPct: i === 0 ? 0 : dropoffPct,
    };
  });
}

async function getFounderDashboard() {
  const [funnel, totalLeads, totalUsers, totalConverted, teamLeads] = await Promise.all([
    getFunnel(),
    Lead.countDocuments(),
    User.countDocuments({ isActive: true }),
    Lead.countDocuments({ status: 'Converted' }),
    User.find({ role: 'team_lead', isActive: true }).select('_id name'),
  ]);

  // Org-wide leaderboard: every BDE, ranked, with their reporting Team Lead
  // attached so the founder can see who's driving which pod.
  const bdes = await User.find({ role: 'bde', isActive: true })
    .select('name stats reportsTo')
    .populate('reportsTo', 'name');

  const leaderboard = bdes
    .map((b) => ({
      id: b._id,
      name: b.name,
      teamLead: b.reportsTo?.name || '—',
      callsMade: b.stats?.callsMade || 0,
      visitsMade: b.stats?.visitsMade || 0,
      conversions: b.stats?.conversions || 0,
    }))
    .sort((a, b) => b.conversions - a.conversions || b.callsMade - a.callsMade);

  // Per-team-lead pod summary: total leads + conversion rate per pod, so the
  // founder dashboard can show "organisation-wide stats across every team"
  // (spec requirement) rather than one flat blended number.
  const teamBreakdown = await Promise.all(
    teamLeads.map(async (tl) => {
      const podBdes = await User.find({ reportsTo: tl._id }).select('_id');
      const podBdeIds = podBdes.map((b) => b._id);
      const podLeadCount = await Lead.countDocuments({ assignedTo: { $in: podBdeIds } });
      const podConverted = await Lead.countDocuments({
        assignedTo: { $in: podBdeIds },
        status: 'Converted',
      });
      return {
        id: tl._id,
        name: tl.name,
        bdeCount: podBdes.length,
        totalLeads: podLeadCount,
        converted: podConverted,
        conversionRate: podLeadCount ? Math.round((podConverted / podLeadCount) * 100) : 0,
      };
    })
  );

  const totalDeals = await Deal.aggregate([{ $group: { _id: null, revenue: { $sum: '$value' } } }]);

  return {
    funnel: buildFunnelWithDropoff(funnel),
    totalLeads,
    totalUsers,
    totalConverted,
    conversionRate: totalLeads ? Math.round((totalConverted / totalLeads) * 100) : 0,
    totalRevenue: totalDeals[0]?.revenue || 0,
    leaderboard,
    teamBreakdown,
  };
}

async function getTeamDashboard(teamLeadId) {
  const bdes = await User.find({ reportsTo: teamLeadId }).select('_id name stats dailyTarget');
  const bdeIds = bdes.map((b) => b._id);

  const funnel = await getFunnel({ assignedTo: { $in: bdeIds } });
  const totalLeads = await Lead.countDocuments({ assignedTo: { $in: bdeIds } });
  const totalConverted = await Lead.countDocuments({
    assignedTo: { $in: bdeIds },
    status: 'Converted',
  });

  const leaderboard = bdes
    .map((b) => ({
      id: b._id,
      name: b.name,
      callsMade: b.stats?.callsMade || 0,
      visitsMade: b.stats?.visitsMade || 0,
      conversions: b.stats?.conversions || 0,
      dailyTarget: b.dailyTarget,
    }))
    .sort((a, b) => b.conversions - a.conversions || b.callsMade - a.callsMade);

  // Per-BDE funnel breakdown (spec: "their pod's stats, funnel, and
  // per-BDE breakdown") - previously the team dashboard only had the
  // pooled funnel with no way to see which BDE's leads are stuck where.
  const perBdeFunnel = await Promise.all(
    bdes.map(async (b) => {
      const bFunnel = await getFunnel({ assignedTo: b._id });
      const bTotal = Object.values(bFunnel).reduce((s, c) => s + c, 0);
      const bConverted = bFunnel['Converted'] || 0;
      return {
        id: b._id,
        name: b.name,
        totalLeads: bTotal,
        converted: bConverted,
        conversionRate: bTotal ? Math.round((bConverted / bTotal) * 100) : 0,
        funnel: bFunnel,
      };
    })
  );

  return {
    funnel: buildFunnelWithDropoff(funnel),
    totalLeads,
    totalConverted,
    conversionRate: totalLeads ? Math.round((totalConverted / totalLeads) * 100) : 0,
    leaderboard,
    perBdeFunnel,
  };
}

async function getBdeDashboard(bdeId) {
  const user = await User.findById(bdeId).select('name stats dailyTarget weeklyTarget reportsTo');
  const funnel = await getFunnel({ assignedTo: bdeId });
  const totalLeads = await Lead.countDocuments({ assignedTo: bdeId });
  const totalConverted = await Lead.countDocuments({ assignedTo: bdeId, status: 'Converted' });

  // Today's calls/visits, for daily target progress - previously the
  // dashboard only showed lifetime stats.callsMade with no relation to
  // "Daily Target", making the stat card meaningless day to day.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [callsToday, visitsToday] = await Promise.all([
    Interaction.countDocuments({ handledBy: bdeId, type: 'call', date: { $gte: startOfDay } }),
    Interaction.countDocuments({
      handledBy: bdeId,
      type: { $in: ['visit', 'demo'] },
      date: { $gte: startOfDay },
    }),
  ]);

  // Rank within own pod, for a bit of friendly competition context.
  let rank = null;
  let podSize = null;
  if (user?.reportsTo) {
    const pod = await User.find({ reportsTo: user.reportsTo }).select('_id stats').lean();
    const sorted = pod.sort((a, b) => (b.stats?.conversions || 0) - (a.stats?.conversions || 0));
    rank = sorted.findIndex((u) => String(u._id) === String(bdeId)) + 1;
    podSize = pod.length;
  }

  return {
    user,
    funnel: buildFunnelWithDropoff(funnel),
    totalLeads,
    totalConverted,
    conversionRate: totalLeads ? Math.round((totalConverted / totalLeads) * 100) : 0,
    callsToday,
    visitsToday,
    dailyTargetProgress: user?.dailyTarget
      ? Math.min(100, Math.round((callsToday / user.dailyTarget) * 100))
      : 0,
    rank,
    podSize,
  };
}

/**
 * Section 4.9 - City/State Coverage Summary. (unchanged from previous pass -
 * kept here for completeness since it lives in this same service file)
 */
async function getCityCoverageSummary(leadScopeQuery = {}) {
  const leadStats = await Lead.aggregate([
    { $match: leadScopeQuery },
    {
      $group: {
        _id: '$cityName',
        totalLeads: { $sum: 1 },
        converted: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
        lastActivityDate: { $max: '$lastContactedAt' },
        agents: { $addToSet: '$assignedTo' },
      },
    },
    { $sort: { totalLeads: -1 } },
  ]);

  const interactionStats = await Lead.aggregate([
    { $match: leadScopeQuery },
    {
      $lookup: {
        from: 'interactions',
        localField: '_id',
        foreignField: 'leadId',
        as: 'interactions',
      },
    },
    { $unwind: '$interactions' },
    {
      $group: {
        _id: '$cityName',
        totalCalled: { $sum: { $cond: [{ $eq: ['$interactions.type', 'call'] }, 1, 0] } },
        totalVisited: { $sum: { $cond: [{ $in: ['$interactions.type', ['visit', 'demo']] }, 1, 0] } },
        outcomes: { $push: '$interactions.outcome' },
      },
    },
  ]);

  const interactionByCity = Object.fromEntries(interactionStats.map((s) => [s._id, s]));

  return leadStats.map((c) => {
    const stats = interactionByCity[c._id] || { totalCalled: 0, totalVisited: 0, outcomes: [] };
    const responseBreakdown = stats.outcomes.reduce((acc, outcome) => {
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {});

    return {
      _id: c._id,
      totalLeads: c.totalLeads,
      converted: c.converted,
      conversionRate: c.totalLeads ? Math.round((c.converted / c.totalLeads) * 100) : 0,
      totalCalled: stats.totalCalled,
      totalVisited: stats.totalVisited,
      responseBreakdown,
      lastActivityDate: c.lastActivityDate,
      activeAgents: c.agents.filter(Boolean).length,
    };
  });
}

module.exports = {
  getFunnel,
  getFounderDashboard,
  getTeamDashboard,
  getBdeDashboard,
  getCityCoverageSummary,
};
