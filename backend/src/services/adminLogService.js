// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Admin Log Service
// Non-blocking audit trail. If logging fails, main ops continue.
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');

/**
 * Log an admin action (fire-and-forget, never blocks main operation)
 */
const logAction = async (adminId, action, targetType, targetId = null, details = null) => {
  try {
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId: targetId ? String(targetId) : null,
        details: details ? String(details) : null,
      },
    });
  } catch (err) {
    // Log failure should NEVER crash the main operation
    console.error('[AdminLog] Failed to write audit log:', err.message);
  }
};

/**
 * Get recent admin logs (for admin dashboard)
 */
const getRecentLogs = async (limit = 50) => {
  return await prisma.adminLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

module.exports = { logAction, getRecentLogs };
