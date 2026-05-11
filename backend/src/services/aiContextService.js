// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — AI Context Service
// Fetches a lightweight user context summary for the AI Coach.
// Returns ONLY summarized data — never raw DB records.
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Build a concise context snapshot for a given user.
 * Used by the AI Coach to personalize responses.
 *
 * @param {number} userId
 * @returns {Object} lightweight context summary
 */
async function getUserContext(userId) {
  try {
    const [weakTopics, roadmapProgress, recentInterviews, recommendations] = await Promise.all([
      // Top 3 weak topics — name + severity only
      prisma.weakTopic.findMany({
        where:   { userId },
        orderBy: { score: 'asc' },
        take:    3,
        select:  { topic: true, severity: true, score: true },
      }),

      // Active roadmap progress — topic titles + percent only
      (async () => {
        const topics = await prisma.roadmapTopic.findMany({
          where:   { isArchived: false },
          include: { modules: { select: { id: true }, orderBy: { orderIndex: 'asc' } } },
          take:    5,
        });

        if (!topics.length) return [];

        const moduleIds = topics.flatMap(t => t.modules.map(m => m.id));
        const progress = moduleIds.length > 0
          ? await prisma.userRoadmapProgress.findMany({
              where: { userId, moduleId: { in: moduleIds }, completed: true },
              select: { moduleId: true },
            })
          : [];

        const completedSet = new Set(progress.map(p => p.moduleId));

        return topics.map(t => {
          const total     = t.modules.length;
          const completed = t.modules.filter(m => completedSet.has(m.id)).length;
          return {
            title:           t.title,
            difficulty:      t.difficulty,
            progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        }).filter(t => t.progressPercent > 0); // Only return topics the user started
      })(),

      // Last 3 interview scores — scores only, no transcripts
      prisma.interview.findMany({
        where:   { userId, status: 'completed' },
        orderBy: { createdAt: 'desc' },
        take:    3,
        select:  { interviewType: true, score: true, technicalScore: true, createdAt: true },
      }),

      // Recommendation count — lightweight
      prisma.recommendation.count({ where: { userId } }),
    ]);

    return {
      weakTopics: weakTopics.map(w => ({ topic: w.topic, severity: w.severity })),
      roadmapProgress,
      recentInterviews: recentInterviews.map(i => ({
        type:           i.interviewType,
        score:          i.score,
        technicalScore: i.technicalScore,
      })),
      hasRecommendations: recommendations > 0,
      recommendationCount: recommendations,
    };
  } catch (err) {
    logger.error('[AIContextService] getUserContext failed:', err.message);
    // Return empty context — AI Coach still works without context
    return {
      weakTopics:         [],
      roadmapProgress:    [],
      recentInterviews:   [],
      hasRecommendations: false,
      recommendationCount: 0,
    };
  }
}

module.exports = { getUserContext };
