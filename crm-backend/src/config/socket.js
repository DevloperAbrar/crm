const { Server } = require('socket.io');
const { CLIENT_URL } = require('./env');

let io;

function initSocket(httpServer) {
  const registerSocketHandlers = require('../sockets/socketHandlers');
  io = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      credentials: true,
    },
  });

  registerSocketHandlers(io);
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialised. Call initSocket first.');
  return io;
}

const rooms = {
  global: () => 'room:global',
  team: (teamId) => `room:team:${teamId}`,
  user: (userId) => `room:user:${userId}`,
};

module.exports = { initSocket, getIO, rooms };
