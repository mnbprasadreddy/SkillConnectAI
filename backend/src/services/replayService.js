const prisma = require('../config/database');
const storageService = require('./storageService');
const logger = require('../utils/logger');

/**
 * Save metadata for an uploaded replay
 */
const saveReplayMetadata = async (userId, interviewId, videoFilename, duration, size) => {
  try {
    const replay = await prisma.interviewReplay.create({
      data: {
        userId: parseInt(userId, 10),
        interviewId: parseInt(interviewId, 10),
        videoUrl: videoFilename, // Stores just the filename locally
        duration: parseInt(duration, 10) || 0,
        size: parseInt(size, 10) || 0,
      },
    });
    return replay;
  } catch (error) {
    logger.error(`Failed to save replay metadata for interview ${interviewId}:`, error.message);
    throw error;
  }
};

/**
 * Get all replays for a user
 */
const getUserReplays = async (userId, req) => {
  try {
    const replays = await prisma.interviewReplay.findMany({
      where: { userId: parseInt(userId, 10) },
      include: {
        interview: {
          select: {
            interviewType: true,
            difficulty: true,
            role: true,
            score: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Resolve public URLs
    return replays.map((replay) => ({
      ...replay,
      videoUrl: replay.videoUrl ? storageService.getReplayUrl(req, replay.videoUrl) : null,
    }));
  } catch (error) {
    logger.error(`Failed to fetch replays for user ${userId}:`, error.message);
    throw error;
  }
};

/**
 * Get a specific replay by its interview ID
 */
const getReplayByInterviewId = async (interviewId, req) => {
  try {
    const replay = await prisma.interviewReplay.findUnique({
      where: { interviewId: parseInt(interviewId, 10) },
      include: {
        interview: true,
      },
    });

    if (replay) {
      replay.videoUrl = replay.videoUrl ? storageService.getReplayUrl(req, replay.videoUrl) : null;
    }

    return replay;
  } catch (error) {
    logger.error(`Failed to fetch replay for interview ${interviewId}:`, error.message);
    throw error;
  }
};

/**
 * Delete a replay safely (DB + File)
 */
const deleteReplay = async (replayId, userId) => {
  try {
    const replay = await prisma.interviewReplay.findUnique({
      where: { id: parseInt(replayId, 10) },
    });

    if (!replay) {
      throw new Error('Replay not found');
    }

    // Auth protection
    if (replay.userId !== parseInt(userId, 10)) {
      throw new Error('Unauthorized');
    }

    // Delete file first
    if (replay.videoUrl) {
      await storageService.deleteReplay(replay.videoUrl);
    }

    // Delete metadata
    await prisma.interviewReplay.delete({
      where: { id: replay.id },
    });

    return true;
  } catch (error) {
    logger.error(`Failed to delete replay ${replayId}:`, error.message);
    throw error;
  }
};

module.exports = {
  saveReplayMetadata,
  getUserReplays,
  getReplayByInterviewId,
  deleteReplay,
};
