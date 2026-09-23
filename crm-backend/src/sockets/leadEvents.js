const { rooms } = require('../config/socket');
const { resolveTeamRoom } = require('./roomResolver');

/**
 * Client-emitted events related to leads. Server-emitted broadcast events
 * (interaction:created, lead:statusChanged, lead:reassigned) are fired
 * directly from the relevant controllers, not here - this file only wires
 * up events the CLIENT initiates, like opening a lead profile.
 */
function registerLeadEvents(io, socket) {
  const { user } = socket;

  // Fired when a user opens a lead profile - powers the "currently viewing"
  // lock indicator (Section 5.4).
  socket.on('lead:viewing', ({ leadId }) => {
    const targetRoom = resolveTeamRoom(user);
    io.to(targetRoom).emit('lead:viewing', {
      leadId,
      viewedBy: { id: user._id, name: user.name },
    });
    // Also notify the Founder's global room so they have org-wide
    // visibility too, unless this IS the global room already.
    if (targetRoom !== rooms.global()) {
      io.to(rooms.global()).emit('lead:viewing', {
        leadId,
        viewedBy: { id: user._id, name: user.name },
      });
    }
  });

  socket.on('lead:stopViewing', ({ leadId }) => {
    const targetRoom = resolveTeamRoom(user);
    io.to(targetRoom).emit('lead:stopViewing', { leadId, userId: user._id });
    if (targetRoom !== rooms.global()) {
      io.to(rooms.global()).emit('lead:stopViewing', { leadId, userId: user._id });
    }
  });
}

module.exports = registerLeadEvents;
