// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Socket.IO Configuration
// ═══════════════════════════════════════════════════════════════

const { Server } = require('socket.io');

let io = null;

/**
 * Initialize Socket.IO with the HTTP server
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (process.env.CLIENT_URL || '*').split(',').map(u => u.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

/**
 * Get the current Socket.IO instance
 * @returns {import('socket.io').Server}
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
}

module.exports = { initializeSocket, getIO };
