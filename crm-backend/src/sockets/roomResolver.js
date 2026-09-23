const { rooms } = require('../config/socket');

/**
 * Resolves which Socket.io room a user's own events (presence, "currently
 * viewing") should broadcast to.
 *
 * BUG FIX: leadEvents.js previously did
 *   user.role === 'bde' ? rooms.team(user.reportsTo) : rooms.team(user._id)
 * For a Founder, that resolves to rooms.team(founderId) - but a Founder
 * never actually joins that room (they only join rooms.global() on
 * connect, per socketHandlers.js). So every "currently viewing" event a
 * Founder emitted was broadcast into an empty room nobody was listening
 * to, including the Founder themselves. Centralizing the logic here fixes
 * it everywhere it's used (leadEvents.js, presenceEvents.js) at once.
 */
function resolveTeamRoom(user) {
  if (user.role === 'founder') return rooms.global();
  if (user.role === 'team_lead') return rooms.team(user._id);
  return rooms.team(user.reportsTo); // bde
}

module.exports = { resolveTeamRoom };
