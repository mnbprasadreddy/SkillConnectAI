// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Socket Manager (v2)
// Real-time event system: Interview, Contest, Analytics namespaces
// Server-side emitters for service → client push
// ═══════════════════════════════════════════════════════════════

const { getIO } = require('../config/socket');
const logger = require('../utils/logger');

function setupSocketHandlers() {
  const io = getIO();

  // ─── Interview Namespace ─────────────────────────────────────
  const interviewNs = io.of('/interview');

  interviewNs.on('connection', (socket) => {
    logger.info(`Interview socket connected: ${socket.id}`);

    socket.on('interview:start', (data) => {
      const room = `interview_${data.interviewId}`;
      socket.join(room);
      logger.info(`User joined interview room: ${room}`);
      socket.to(room).emit('interview:user-joined', { userId: data.userId });
    });

    socket.on('interview:question', (data) => {
      const room = `interview_${data.interviewId}`;
      interviewNs.to(room).emit('interview:question', data);
    });

    socket.on('interview:answer', (data) => {
      const room = `interview_${data.interviewId}`;
      interviewNs.to(room).emit('interview:answer-received', {
        interviewId: data.interviewId,
        questionIndex: data.questionIndex,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('interview:analytics-update', (data) => {
      const room = `interview_${data.interviewId}`;
      interviewNs.to(room).emit('interview:analytics-update', data);
    });

    socket.on('interview:timer-sync', (data) => {
      const room = `interview_${data.interviewId}`;
      interviewNs.to(room).emit('interview:timer-sync', {
        elapsed: data.elapsed,
        remaining: data.remaining,
        serverTime: Date.now(),
      });
    });

    socket.on('interview:end', (data) => {
      const room = `interview_${data.interviewId}`;
      interviewNs.to(room).emit('interview:ended', {
        interviewId: data.interviewId,
        endedAt: new Date().toISOString(),
      });
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      logger.info(`Interview socket disconnected: ${socket.id}`);
    });
  });

  // ─── Contest Namespace ───────────────────────────────────────
  const contestNs = io.of('/contest');

  contestNs.on('connection', (socket) => {
    logger.info(`Contest socket connected: ${socket.id}`);

    socket.on('contest:join', (data) => {
      const room = `contest_${data.contestId}`;
      socket.join(room);
      logger.info(`User joined contest room: ${room}`);

      // Send current participant count
      const roomSize = contestNs.adapter.rooms?.get(room)?.size || 0;
      contestNs.to(room).emit('contest:participant-count', { count: roomSize });
    });

    socket.on('contest:submit', (data) => {
      const room = `contest_${data.contestId}`;
      contestNs.to(room).emit('contest:submission-received', {
        userId: data.userId,
        score: data.score,
        timestamp: Date.now(),
      });
    });

    socket.on('contest:timer-tick', (data) => {
      const room = `contest_${data.contestId}`;
      contestNs.to(room).emit('contest:timer-tick', {
        remaining: data.remaining,
        serverTime: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Contest socket disconnected: ${socket.id}`);
    });
  });

  // ─── Analytics Namespace ─────────────────────────────────────
  const analyticsNs = io.of('/analytics');

  analyticsNs.on('connection', (socket) => {
    logger.info(`Analytics socket connected: ${socket.id}`);

    socket.on('analytics:subscribe', (data) => {
      const room = `analytics_${data.userId}`;
      socket.join(room);
      logger.info(`User subscribed to analytics room: ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Analytics socket disconnected: ${socket.id}`);
    });
  });

  logger.info('✅ Socket.IO handlers registered');
}

// ═══════════════════════════════════════════════════════════════
// Server-Side Emitters (called from services/controllers)
// ═══════════════════════════════════════════════════════════════

/**
 * Emit live interview analytics to a specific interview room
 */
function emitInterviewAnalytics(interviewId, analyticsData) {
  try {
    const io = getIO();
    io.of('/interview').to(`interview_${interviewId}`).emit('interview:live-analytics', {
      interviewId,
      analytics: analyticsData,
      timestamp: Date.now(),
    });
  } catch (err) {
    logger.warn('Failed to emit interview analytics:', err.message);
  }
}

/**
 * Emit interview score update
 */
function emitInterviewScoreUpdate(interviewId, scores) {
  try {
    const io = getIO();
    io.of('/interview').to(`interview_${interviewId}`).emit('interview:score-update', {
      interviewId,
      scores,
      timestamp: Date.now(),
    });
  } catch (err) {
    logger.warn('Failed to emit interview score:', err.message);
  }
}

/**
 * Emit new question to interview room
 */
function emitInterviewQuestion(interviewId, question) {
  try {
    const io = getIO();
    io.of('/interview').to(`interview_${interviewId}`).emit('interview:new-question', {
      interviewId,
      question,
      timestamp: Date.now(),
    });
  } catch (err) {
    logger.warn('Failed to emit interview question:', err.message);
  }
}

/**
 * Emit leaderboard update to a contest room
 */
function emitLeaderboardUpdate(contestId, leaderboard) {
  try {
    const io = getIO();
    io.of('/contest').to(`contest_${contestId}`).emit('contest:leaderboard-update', {
      contestId,
      leaderboard,
      updatedAt: Date.now(),
    });
  } catch (err) {
    logger.warn('Failed to emit leaderboard update:', err.message);
  }
}

/**
 * Emit contest status change (active, completed, etc.)
 */
function emitContestStatusChange(contestId, status) {
  try {
    const io = getIO();
    io.of('/contest').to(`contest_${contestId}`).emit('contest:status-change', {
      contestId,
      status,
      timestamp: Date.now(),
    });
  } catch (err) {
    logger.warn('Failed to emit contest status:', err.message);
  }
}

/**
 * Emit analytics update to a specific user's analytics room
 */
function emitAnalyticsUpdate(userId, data) {
  try {
    const io = getIO();
    io.of('/analytics').to(`analytics_${userId}`).emit('analytics:live-update', {
      userId,
      data,
      timestamp: Date.now(),
    });
  } catch (err) {
    logger.warn('Failed to emit analytics update:', err.message);
  }
}

/**
 * Emit submission result to user's analytics room
 */
function emitSubmissionResult(userId, submissionData) {
  try {
    const io = getIO();
    io.of('/analytics').to(`analytics_${userId}`).emit('analytics:submission-result', {
      userId,
      submission: submissionData,
      timestamp: Date.now(),
    });
  } catch (err) {
    logger.warn('Failed to emit submission result:', err.message);
  }
}

/**
 * Emit dashboard refresh signal
 */
function emitDashboardRefresh(userId) {
  try {
    const io = getIO();
    io.of('/analytics').to(`analytics_${userId}`).emit('analytics:dashboard-refresh', {
      userId,
      timestamp: Date.now(),
    });
  } catch (err) {
    logger.warn('Failed to emit dashboard refresh:', err.message);
  }
}

module.exports = {
  setupSocketHandlers,
  // Server-side emitters
  emitInterviewAnalytics,
  emitInterviewScoreUpdate,
  emitInterviewQuestion,
  emitLeaderboardUpdate,
  emitContestStatusChange,
  emitAnalyticsUpdate,
  emitSubmissionResult,
  emitDashboardRefresh,
};
