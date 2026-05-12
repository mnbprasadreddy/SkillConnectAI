const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');
const logger = require('../utils/logger');

// Run cleanup once a day (24 hours)
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const REPLAY_UPLOAD_DIR = path.join(__dirname, '../../uploads/interviews');

/**
 * Perform automatic cleanup of old replays to save disk space.
 */
const cleanupOldReplays = async () => {
  try {
    const retentionDays = parseInt(process.env.REPLAY_RETENTION_DAYS || '7', 10);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

    logger.info(`[ReplayCleanup] Starting cleanup for replays older than ${retentionDays} days (${thresholdDate.toISOString()})`);

    // Find replays older than threshold
    const oldReplays = await prisma.interviewReplay.findMany({
      where: {
        createdAt: {
          lt: thresholdDate,
        },
      },
    });

    if (oldReplays.length === 0) {
      logger.info('[ReplayCleanup] No old replays found to clean up.');
      return;
    }

    let deletedCount = 0;

    for (const replay of oldReplays) {
      try {
        // Delete file if it exists locally
        if (replay.videoUrl && !replay.videoUrl.startsWith('http')) {
          const filePath = path.join(REPLAY_UPLOAD_DIR, replay.videoUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        // Delete from database
        await prisma.interviewReplay.delete({
          where: { id: replay.id },
        });

        deletedCount++;
      } catch (err) {
        logger.error(`[ReplayCleanup] Failed to delete replay ID ${replay.id}:`, err.message);
      }
    }

    logger.info(`[ReplayCleanup] Successfully deleted ${deletedCount} old replays.`);
  } catch (error) {
    logger.error('[ReplayCleanup] Job failed:', error.message);
  }
};

/**
 * Start the background cleanup job.
 * Non-blocking interval.
 */
const startCleanupJob = () => {
  // Run once on startup (with slight delay so server can bind first)
  setTimeout(() => {
    cleanupOldReplays();
  }, 10000); // 10 seconds after boot

  // Then run periodically
  setInterval(cleanupOldReplays, CLEANUP_INTERVAL_MS);
};

module.exports = {
  startCleanupJob,
};
