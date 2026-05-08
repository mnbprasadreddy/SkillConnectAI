// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Prisma Client Singleton
// Configured for Neon PostgreSQL with connection pooling
// ═══════════════════════════════════════════════════════════════

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

const prismaOptions = {
  log:
    process.env.NODE_ENV === 'production'
      ? [{ level: 'error', emit: 'stdout' }]
      : [
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaOptions);
} else {
  // In development, reuse the client across hot-reloads
  if (!global.__prisma) {
    global.__prisma = new PrismaClient(prismaOptions);
  }
  prisma = global.__prisma;
}

// Test connection on first import
(async () => {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected via Prisma');
  } catch (error) {
    logger.error('❌ PostgreSQL connection failed:', error.message);
    logger.warn('  ↳ If using Neon, the database may be waking up. Retrying...');
    // Retry once after 3 seconds for Neon cold starts
    setTimeout(async () => {
      try {
        await prisma.$connect();
        logger.info('✅ PostgreSQL reconnected on retry');
      } catch (retryError) {
        logger.error('❌ PostgreSQL retry failed:', retryError.message);
      }
    }, 3000);
  }
})();

module.exports = prisma;
