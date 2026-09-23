// Maps each role to its landing/home route after login.
export const roleHomeRoute = {
  founder: '/dashboard/founder',
  team_lead: '/dashboard/team',
  bde: '/dashboard/bde',
};

// Route access matrix, mirrors Section 15 (RBAC) with one intentional
// client-requested override: Import is Founder-only here, even though the
// original blueprint's table listed Team Lead as "Yes (own team)".
// The API is the real enforcement point; this only hides UI a role
// shouldn't see.
export const routeAccess = {
  '/team': ['founder', 'team_lead'],
  '/settings': ['founder'],
  '/fraud': ['founder', 'team_lead'],
  '/import': ['founder'],
  '/reports': ['founder', 'team_lead'],
  '/audit-logs': ['founder'],
  '/coverage-summary': ['founder', 'team_lead'],
  '/coverage-tracker': ['founder'], // new: city x category "already pitched" tracker
  '/dashboard/founder': ['founder'],
  '/dashboard/team': ['team_lead', 'founder'],
};

export function canAccess(role, path) {
  const allowed = routeAccess[path];
  if (!allowed) return true;
  return allowed.includes(role);
}
