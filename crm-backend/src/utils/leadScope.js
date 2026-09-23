/**
 * Section 15 (RBAC) scope helpers, shared across every controller that
 * touches Lead documents (leads, map, deals, dashboard).
 *
 * These were previously copy-pasted separately into lead.controller.js and
 * never added to map.controller.js at all - which is exactly how the Map
 * page ended up with zero role scoping (a Team Lead could see every lead
 * in the org's pins/heatmap/city-drilldown). Centralizing this in one file
 * means every consumer gets the same, correctly-tested behavior, and a
 * future fix here fixes it everywhere at once instead of needing to be
 * remembered in N places.
 */

// Builds the Mongo filter that restricts a Lead query to the caller's scope.
function buildLeadScopeQuery(scope) {
  if (scope.role === 'founder') return {};
  return { assignedTo: { $in: scope.teamBdeIds } };
}

// Checks whether a single already-fetched Lead document is in the caller's
// scope. Handles BOTH shapes of lead.assignedTo: a raw ObjectId (lead
// fetched without .populate()) and a populated User sub-document (lead
// fetched with .populate('assignedTo', ...)) - mixing these up was the
// root cause of the earlier 403 bug on lead profile pages.
function leadInScope(lead, scope) {
  if (scope.role === 'founder') return true;
  if (!lead.assignedTo) return false;
  const assignedToId = lead.assignedTo._id ? String(lead.assignedTo._id) : String(lead.assignedTo);
  return scope.teamBdeIds.some((id) => String(id) === assignedToId);
}

module.exports = { buildLeadScopeQuery, leadInScope };
