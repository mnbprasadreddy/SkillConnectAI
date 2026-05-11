// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Server Entry Point
// Auto-clears port conflicts before binding.
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();

const http = require('http');
const { execSync } = require('child_process');
const app = require('./app');
const { initializeSocket } = require('./config/socket');
const { setupSocketHandlers } = require('./socket/socketManager');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// ── Auto-free the port before binding ────────────────────────────
// This prevents EADDRINUSE on every restart without any manual steps.
function freePort(port) {
  try {
    const pids = execSync(
      `powershell -Command "(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue).OwningProcess"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();

    if (pids) {
      const pidList = [...new Set(pids.split(/\r?\n/).filter(Boolean))];
      pidList.forEach(pid => {
        try {
          execSync(`powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`, { stdio: 'ignore' });
        } catch (_) {}
      });
      logger.info(`🧹 Auto-cleared port ${port} (killed PID: ${pidList.join(', ')})`);
    }
  } catch (_) {
    // Port is already free — nothing to do
  }
}

// Run the auto-clear before creating the server
freePort(PORT);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);
setupSocketHandlers();

const judge0Service = require('./services/judge0Service');
const seedSuperAdmin = require('./utils/adminSeed');

// Start server
server.listen(PORT, async () => {
  logger.info(`═══════════════════════════════════════════════════`);
  logger.info(`  SkillConnect AI Backend`);
  logger.info(`  Port: ${PORT}`);
  logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`  API: http://localhost:${PORT}`);
  logger.info(`  Health: http://localhost:${PORT}/api/health`);
  logger.info(`═══════════════════════════════════════════════════`);

  // ── API Key status ─────────────────────────────────────────────
  const dgKey = process.env.DEEPGRAM_API_KEY;
  if (dgKey && dgKey.trim().length > 10) {
    logger.info(`[Deepgram] API Key Loaded: YES ✓ (${dgKey.slice(0,4)}...${dgKey.slice(-4)})`);
  } else {
    logger.warn(`[Deepgram] API Key Loaded: NO ✗ — STT will fall back to Web Speech API`);
    logger.warn(`[Deepgram] Add DEEPGRAM_API_KEY to backend/.env to enable high-quality transcription`);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  logger.info(`[Gemini]   API Key Loaded: ${geminiKey && geminiKey.length > 10 ? 'YES ✓' : 'NO ✗'}`);
  // ──────────────────────────────────────────────────────────────

  // Validate Judge0 connection on startup
  await judge0Service.validateConnection();

  // Seed super admin (idempotent, non-fatal)
  await seedSuperAdmin();
});

// Fallback error handler (should rarely trigger now)
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${PORT} still in use after auto-clear. Please restart.`);
  } else {
    logger.error('Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  server.close(() => process.exit(1));
});
