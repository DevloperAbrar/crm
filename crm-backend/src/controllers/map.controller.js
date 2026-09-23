const Lead = require('../models/Lead');
const { getCityCoverageSummary } = require('../services/aggregation.service');
const { buildLeadScopeQuery } = require('../utils/leadScope');
const { success, error } = require('../utils/apiResponse');

exports.getPins = async (req, res) => {
  try {
    const { state, city, category, status, assignedTo } = req.query;

    // SECURITY FIX: this endpoint previously built its query only from
    // req.query filters, with no role scoping at all - a Team Lead viewing
    // the Map saw every lead in the entire organization, not just their
    // own team's. Now starts from the same scoped base every other Lead
    // endpoint uses.
    const query = { ...buildLeadScopeQuery(req.scope), lat: { $ne: null }, lng: { $ne: null } };

    if (state) query.stateCode = state;
    if (city) query.cityName = city;
    if (category) query.categoryId = category;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    // Populate name + colour (not just the raw ObjectId) so the frontend
    // can render each pin tinted by its category colour and label it in
    // the popup, without a second round-trip to fetch categories per pin.
    const pins = await Lead.find(query)
      .select('businessName lat lng status categoryId cityName assignedTo')
      .populate('categoryId', 'name colour');

    return success(res, pins);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getHeatmap = async (req, res) => {
  try {
    const { mode = 'density' } = req.query; // density | conversion
    const statusFilter = mode === 'conversion' ? { status: 'Converted' } : {};

    // Same fix as getPins: scope first, then apply mode-specific filter.
    const query = {
      ...buildLeadScopeQuery(req.scope),
      ...statusFilter,
      lat: { $ne: null },
      lng: { $ne: null },
    };

    const points = await Lead.find(query).select('lat lng');
    return success(res, points);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getCityDrilldown = async (req, res) => {
  try {
    const cityName = req.params.cityId;
    const scopeQuery = buildLeadScopeQuery(req.scope);

    // Same fix again: previously `Lead.find({ cityName })` had no scope
    // restriction, so a Team Lead clicking a city on the map saw every
    // lead in that city org-wide, not just their own team's.
    const leads = await Lead.find({ ...scopeQuery, cityName }).populate('assignedTo', 'name');

    const summaries = await getCityCoverageSummary(scopeQuery);
    const summary = summaries.find((c) => c._id === cityName);

    return success(res, { summary, leads });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/map/coverage-summary
 *
 * Section 4.9 - City/State Coverage Summary (auto-calculated).
 * Returns, per city: total leads, total called, total visited, response
 * breakdown, conversion rate, last activity date, and active agent count.
 *
 * Scoped via the same buildLeadScopeQuery every other Lead-backed endpoint
 * uses: Founder sees every city, Team Lead sees only cities their own BDEs
 * have leads in (their pod's leads only, per Lead.assignedTo), BDE sees
 * only their own leads' cities.
 *
 * Also rolls the per-city rows up into a per-state summary, since the
 * spec asks for "City/State Coverage Summary" - state is derived from
 * Lead.stateCode already present on each lead in scope.
 */
exports.getCoverageSummary = async (req, res) => {
  try {
    const scopeQuery = buildLeadScopeQuery(req.scope);
    const cities = await getCityCoverageSummary(scopeQuery);

    const cityToState = {};
    const leadsForStateMap = await Lead.find(scopeQuery).select('cityName stateCode');
    leadsForStateMap.forEach((l) => {
      if (l.cityName && l.stateCode && !cityToState[l.cityName]) {
        cityToState[l.cityName] = l.stateCode;
      }
    });

    const stateMap = {};
    cities.forEach((c) => {
      const stateCode = cityToState[c._id] || 'Unknown';
      if (!stateMap[stateCode]) {
        stateMap[stateCode] = {
          stateCode,
          totalLeads: 0,
          converted: 0,
          totalCalled: 0,
          totalVisited: 0,
          activeAgents: new Set(),
          cityCount: 0,
          lastActivityDate: null,
        };
      }
      const s = stateMap[stateCode];
      s.totalLeads += c.totalLeads;
      s.converted += c.converted;
      s.totalCalled += c.totalCalled;
      s.totalVisited += c.totalVisited;
      s.cityCount += 1;
      if (!s.lastActivityDate || (c.lastActivityDate && c.lastActivityDate > s.lastActivityDate)) {
        s.lastActivityDate = c.lastActivityDate;
      }
    });

    const leadsWithAgents = await Lead.find(scopeQuery).select('cityName assignedTo');
    leadsWithAgents.forEach((l) => {
      const stateCode = cityToState[l.cityName] || 'Unknown';
      if (l.assignedTo && stateMap[stateCode]) {
        stateMap[stateCode].activeAgents.add(String(l.assignedTo));
      }
    });

    const states = Object.values(stateMap)
      .map((s) => ({
        stateCode: s.stateCode,
        totalLeads: s.totalLeads,
        converted: s.converted,
        conversionRate: s.totalLeads ? Math.round((s.converted / s.totalLeads) * 100) : 0,
        totalCalled: s.totalCalled,
        totalVisited: s.totalVisited,
        cityCount: s.cityCount,
        activeAgents: s.activeAgents.size,
        lastActivityDate: s.lastActivityDate,
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads);

    return success(res, { cities, states });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
