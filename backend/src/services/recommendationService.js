// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Recommendation Service (v2)
// Intelligent recommendation engine with adaptive difficulty
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const axios = require('axios');
const { RECOMMENDATION_TYPES } = require('../utils/constants');
const { calcPercentage } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Generate comprehensive recommendations for a user
 * Analyzes: weak topics, failed submissions, interview performance,
 * coding accuracy, confidence scores, and generates adaptive suggestions
 */
const generateRecommendations = async (userId) => {
  const [submissions, interviews, user, existingRecs] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      include: { problem: { select: { id: true, topic: true, difficulty: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.interview.findMany({
      where: { userId, status: 'completed' },
      include: { analytics: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.recommendation.count({ where: { userId } }),
  ]);

  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  const recommendations = [];

  // ── 1. Topic Analysis & Weak Topic Detection ─────────────
  const { weakTopics, topicStats } = await getWeakTopics(userId, submissions);
  // Find untried topics
  const allTopics = await prisma.problem.findMany({
    select: { topic: true },
    distinct: ['topic'],
  });
  const triedTopics = new Set(Object.keys(topicStats));
  const untriedTopics = allTopics.map((t) => t.topic).filter((t) => !triedTopics.has(t));

  // ── 2. Problem Recommendations ──────────────────────────
  const adaptiveDifficulty = getAdaptiveDifficulty(user.accuracy, user.skillLevel, submissions.length);

  if (weakTopics.length > 0) {
    const weakTopicNames = weakTopics.slice(0, 3).map((t) => t.topic);
    const solvedIds = [...new Set(submissions.filter((s) => s.result === 'accepted').map((s) => s.problem.id))];

    const suggested = await prisma.problem.findMany({
      where: {
        topic: { in: weakTopicNames },
        difficulty: adaptiveDifficulty,
        id: { notIn: solvedIds.length > 0 ? solvedIds : [0] },
      },
      take: 5,
      select: { id: true, title: true, topic: true, difficulty: true },
    });

    if (suggested.length > 0) {
      recommendations.push({
        userId,
        recommendationType: RECOMMENDATION_TYPES.PROBLEM,
        content: JSON.stringify({
          type: 'weak_topic_practice',
          message: `Focus on weak areas: ${weakTopicNames.join(', ')}`,
          weakTopics: weakTopics.slice(0, 3),
          suggestedProblems: suggested,
          difficulty: adaptiveDifficulty,
        }),
      });
    }
  }

  // Suggest untried topics
  if (untriedTopics.length > 0) {
    const newTopicProblems = await prisma.problem.findMany({
      where: { topic: { in: untriedTopics.slice(0, 3) }, difficulty: 'Easy' },
      take: 3,
      select: { id: true, title: true, topic: true, difficulty: true },
    });

    if (newTopicProblems.length > 0) {
      recommendations.push({
        userId,
        recommendationType: RECOMMENDATION_TYPES.TOPIC,
        content: JSON.stringify({
          type: 'explore_new_topics',
          message: `Explore new topics: ${untriedTopics.slice(0, 3).join(', ')}`,
          topics: untriedTopics.slice(0, 3),
          suggestedProblems: newTopicProblems,
        }),
      });
    }
  }

  // ── 3. Difficulty Progression ────────────────────────────
  const solvedByDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  const solvedProblemIds = new Set();
  for (const sub of submissions) {
    if (sub.result === 'accepted' && !solvedProblemIds.has(sub.problem.id)) {
      solvedProblemIds.add(sub.problem.id);
      solvedByDifficulty[sub.problem.difficulty]++;
    }
  }

  if (solvedByDifficulty.Easy >= 5 && solvedByDifficulty.Medium < 3) {
    recommendations.push({
      userId,
      recommendationType: RECOMMENDATION_TYPES.GENERAL,
      content: JSON.stringify({
        type: 'difficulty_progression',
        message: 'Great progress on Easy problems! Time to tackle Medium difficulty.',
        currentLevel: 'Easy',
        suggestedLevel: 'Medium',
        easySolved: solvedByDifficulty.Easy,
      }),
    });
  } else if (solvedByDifficulty.Medium >= 10 && solvedByDifficulty.Hard < 3) {
    recommendations.push({
      userId,
      recommendationType: RECOMMENDATION_TYPES.GENERAL,
      content: JSON.stringify({
        type: 'difficulty_progression',
        message: 'Strong Medium performance! Challenge yourself with Hard problems.',
        currentLevel: 'Medium',
        suggestedLevel: 'Hard',
        mediumSolved: solvedByDifficulty.Medium,
      }),
    });
  }

  // ── 4. Interview Recommendations ─────────────────────────
  if (interviews.length === 0) {
    recommendations.push({
      userId,
      recommendationType: RECOMMENDATION_TYPES.INTERVIEW,
      content: JSON.stringify({
        type: 'first_interview',
        message: 'Start your first mock interview to build confidence!',
        suggestedType: 'behavioral',
        suggestedDifficulty: 'Easy',
      }),
    });
  } else {
    const avgScore = interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length;
    const avgConfidence = interviews
      .filter((i) => i.confidenceScore !== null)
      .reduce((sum, i) => sum + i.confidenceScore, 0) / (interviews.filter((i) => i.confidenceScore !== null).length || 1);

    // Interview type distribution
    const typeCounts = {};
    for (const interview of interviews) {
      typeCounts[interview.interviewType] = (typeCounts[interview.interviewType] || 0) + 1;
    }
    const leastPracticedType = Object.entries(typeCounts).sort((a, b) => a[1] - b[1])[0]?.[0];

    if (avgScore < 60) {
      recommendations.push({
        userId,
        recommendationType: RECOMMENDATION_TYPES.INTERVIEW,
        content: JSON.stringify({
          type: 'improve_score',
          message: `Your average interview score is ${Math.round(avgScore)}. Practice more to improve!`,
          averageScore: Math.round(avgScore),
          suggestedType: 'behavioral',
          suggestedDifficulty: 'Easy',
        }),
      });
    }

    if (avgConfidence < 60) {
      recommendations.push({
        userId,
        recommendationType: RECOMMENDATION_TYPES.INTERVIEW,
        content: JSON.stringify({
          type: 'build_confidence',
          message: 'Focus on building interview confidence through practice.',
          averageConfidence: Math.round(avgConfidence),
          tips: [
            'Practice with the camera on to get comfortable',
            'Prepare stories using the STAR method',
            'Slow down your speaking pace',
          ],
        }),
      });
    }

    // Low-coverage interview type
    if (leastPracticedType) {
      const allTypes = ['behavioral', 'technical', 'system_design', 'coding', 'hr'];
      const untriedTypes = allTypes.filter((t) => !typeCounts[t]);
      if (untriedTypes.length > 0) {
        recommendations.push({
          userId,
          recommendationType: RECOMMENDATION_TYPES.INTERVIEW,
          content: JSON.stringify({
            type: 'try_new_type',
            message: `Try a ${untriedTypes[0]} interview to round out your preparation.`,
            suggestedType: untriedTypes[0],
            triedTypes: Object.keys(typeCounts),
          }),
        });
      }
    }
  }

  // ── 5. Streak & Activity Recommendations ──────────────────
  if (user.streak < 3) {
    recommendations.push({
      userId,
      recommendationType: RECOMMENDATION_TYPES.GENERAL,
      content: JSON.stringify({
        type: 'build_streak',
        message: `Current streak: ${user.streak} days. Solve at least one problem daily to build momentum!`,
        currentStreak: user.streak,
        target: 7,
      }),
    });
  } else if (user.streak >= 7 && user.streak < 30) {
    recommendations.push({
      userId,
      recommendationType: RECOMMENDATION_TYPES.GENERAL,
      content: JSON.stringify({
        type: 'maintain_streak',
        message: `Excellent ${user.streak}-day streak! Keep going for 30 days!`,
        currentStreak: user.streak,
        target: 30,
      }),
    });
  }

  // ── 6. Save Recommendations ─────────────────────────────
  if (recommendations.length > 0) {
    await prisma.recommendation.deleteMany({ where: { userId } });
    await prisma.recommendation.createMany({ data: recommendations });
  }

  return recommendations.map((r) => ({
    ...r,
    content: JSON.parse(r.content),
  }));
};

/**
 * Get adaptive difficulty based on user performance
 */
function getAdaptiveDifficulty(accuracy, skillLevel, totalSubmissions) {
  if (totalSubmissions < 5) return 'Easy';

  if (skillLevel === 'expert' || accuracy >= 80) return 'Hard';
  if (skillLevel === 'advanced' || accuracy >= 60) return 'Medium';
  if (skillLevel === 'intermediate' || accuracy >= 40) return 'Medium';
  return 'Easy';
}

/**
 * Get current recommendations for a user (parsed)
 */
const getRecommendations = async (userId) => {
  const recs = await prisma.recommendation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return recs.map((r) => {
    let content;
    try { content = JSON.parse(r.content); }
    catch { content = { message: r.content }; }

    return {
      id: r.id,
      type: r.recommendationType,
      content,
      createdAt: r.createdAt,
    };
  });
};

/**
 * Get weak topics specifically for the AI Interview adaptation
 */
const getWeakTopics = async (userId, preloadedSubmissions = null) => {
  const submissions = preloadedSubmissions || await prisma.submission.findMany({
    where: { userId },
    include: { problem: { select: { id: true, topic: true } } },
  });

  const topicStats = {};

  for (const sub of submissions) {
    const t = sub.problem.topic;
    if (!topicStats[t]) topicStats[t] = { total: 0, accepted: 0, problems: new Set(), recentFails: 0 };
    topicStats[t].total++;
    topicStats[t].problems.add(sub.problem.id);
    if (sub.result === 'accepted') {
      topicStats[t].accepted++;
    } else {
      topicStats[t].recentFails++;
    }
  }

  const weakTopics = Object.entries(topicStats)
    .filter(([_, s]) => s.total >= 2 && (s.accepted / s.total) < 0.5)
    .sort((a, b) => (a[1].accepted / a[1].total) - (b[1].accepted / b[1].total))
    .map(([topic, stats]) => ({
      topic,
      accuracy: calcPercentage(stats.accepted, stats.total),
      attempts: stats.total,
    }));

  return { weakTopics, topicStats };
};

module.exports = { generateRecommendations, getRecommendations, getWeakTopics };
