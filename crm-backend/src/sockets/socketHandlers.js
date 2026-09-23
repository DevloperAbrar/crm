const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');
const { rooms } = require('../config/socket');
const { resolveTeamRoom } = require('./roomResolver');
const registerLeadEvents = require('./leadEvents');
const registerPresenceEvents = require('./presenceEvents');

function registerSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No auth token'));

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket auth failed: ' + err.message));
    }
  });

  io.on('connection', async (socket) => {
    const { user } = socket;

    if (user.role === 'founder') {
      socket.join(rooms.global());
    } else if (user.role === 'team_lead') {
      socket.join(rooms.team(user._id));
    } else if (user.role === 'bde' && user.reportsTo) {
      socket.join(rooms.user(user._id));
      socket.join(rooms.team(user.reportsTo));
    }

    console.log(`[socket] ${user.name} (${user.role}) connected`);

    registerLeadEvents(io, socket);
    registerPresenceEvents(io, socket);

    socket.on('disconnect', async () => {
      console.log(`[socket] ${user.name} disconnected`);

      try {
        await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeenAt: new Date() });
      } catch (err) {
        console.warn('[socket] Failed to update presence on disconnect (non-fatal):', err.message);
      }

      try {
        const targetRoom = resolveTeamRoom(user);
        const payload = { userId: user._id, isOnline: false };
        io.to(targetRoom).emit('presence:update', payload);
        if (targetRoom !== rooms.global()) {
          io.to(rooms.global()).emit('presence:update', payload);
        }
      } catch (err) {
        console.warn('[socket] Failed to broadcast presence update (non-fatal):', err.message);
      }
    });
  });
}

module.exports = registerSocketHandlers;
