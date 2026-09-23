const { rooms } = require('../config/socket');
const { resolveTeamRoom } = require('./roomResolver');
const User = require('../models/User');

function registerPresenceEvents(io, socket) {
  const { user } = socket;

  User.findByIdAndUpdate(user._id, { isOnline: true, lastSeenAt: new Date() }).catch((err) => {
    console.warn('[presence] Failed to mark user online (non-fatal):', err.message);
  });

  const targetRoom = resolveTeamRoom(user);
  const payload = { userId: user._id, isOnline: true };
  io.to(targetRoom).emit('presence:update', payload);
  if (targetRoom !== rooms.global()) {
    io.to(rooms.global()).emit('presence:update', payload);
  }

  socket.on('presence:idle', () => {
    const idlePayload = { userId: user._id, isOnline: false, idle: true };
    io.to(targetRoom).emit('presence:update', idlePayload);
    if (targetRoom !== rooms.global()) {
      io.to(rooms.global()).emit('presence:update', idlePayload);
    }
  });
}

module.exports = registerPresenceEvents;
