// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Server Entry Point
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./config/socket');
const { setupSocketHandlers } = require('./socket/socketManager');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);
setupSocketHandlers();

const judge0Service = require('./services/judge0Service');

// Start server
server.listen(PORT, async () => {
  logger.info(`═══════════════════════════════════════════════════`);
  logger.info(`  SkillConnect AI Backend`);
  logger.info(`  Port: ${PORT}`);
  logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`  API: http://localhost:${PORT}`);
  logger.info(`  Health: http://localhost:${PORT}/api/health`);
  logger.info(`═══════════════════════════════════════════════════`);
  
  // Validate Judge0 connection on startup
  await judge0Service.validateConnection();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
