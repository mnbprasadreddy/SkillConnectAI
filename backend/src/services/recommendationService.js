// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Recommendation Service (v3 — AI Engine)
// Upgraded with weak topic engine, material recommendations,
// AI explanations, and adaptive recovery.
// NEVER blocks code execution, dashboard, interview, or contest.
// Falls back gracefully on any failure.
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const { RECOMMENDATION_TYPES } = require('../utils/constants');
const { calcPercentage } = require('../utils/helpers');
const weakTopicEngine = require('./weakTopicEngine');

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION — on-demand only, never continuous
// ═══════════════════════════════════════════════════════════════

const generateRecommendations = async (userId) => {
  try {
    const [user, submissions, interviews] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.submission.findMany({
        where: { userId },
        include: { problem: { select: { id: true, topic: true, difficulty: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.interview.findMany({
        where: { userId, status: 'completed' },
        select: {
          id: true, interviewType: true, score: true,
          confidenceScore: true, technicalScore: true,
          codingScore: true, communicationScore: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    // 1. Run AI weak topic analysis
    const analysis = await weakTopicEngine.analyzeUser(userId);
    const { weakTopics, strongTopics, allTopics } = analysis;

    const recommendations = [];

    // 2. Problem Recommendations — based on weak topics
    const adaptiveDifficulty = getAdaptiveDifficulty(user.accuracy, user.skillLevel, submissions.length);
    if (weakTopics.length > 0) {
      const weakTopicNames = weakTopics.slice(0, 3).map(t => t.topic);
      const solvedIds = [...new Set(submissions.filter(s => s.result === 'accepted').map(s => s.problem.id))];

      const suggested = await prisma.problem.findMany({
        where: {
          topic: { in: weakTopicNames },
          difficulty: adaptiveDifficulty,
          isArchived: false,
          id: { notIn: solvedIds.length > 0 ? solvedIds : [0] },
        },
        take: 5,
        select: { id: true, title: true, topic: true, difficulty: true },
      });

      if (suggested.length > 0) {
        const topicExplanations = weakTopics.slice(0, 3).map(t =>
          `${t.topic}: ${t.score}% (${t.severity})`
        );

        recommendations.push({
          userId,
          recommendationType: RECOMMENDATION_TYPES.PROBLEM,
          content: JSON.stringify({
            type: 'weak_topic_practice',
            message: `Your AI analysis detected weak areas. Focus on: ${weakTopicNames.join(', ')}`,
            explanation: `Based on your submission accuracy, contest performance, and coding efficiency, these topics need attention:\n${topicExplanations.join('\n')}`,
            weakTopics: weakTopics.slice(0, 3),
            suggestedProblems: suggested,
            difficulty: adaptiveDifficulty,
            priority: 'high',
          }),
        });
      }
    }

    // 3. Explore untried topics
    const allDbTopics = await prisma.problem.findMany({
      select: { topic: true }, distinct: ['topic'], where: { isArchived: false },
    });
    const triedTopics = new Set((allTopics || []).map(t => t.topic));
    const untriedTopics = allDbTopics.map(t => t.topic).filter(t => !triedTopics.has(t));

    if (untriedTopics.length > 0) {
      const newTopicProblems = await prisma.problem.findMany({
        where: { topic: { in: untriedTopics.slice(0, 3) }, difficulty: 'Easy', isArchived: false },
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
            explanation: 'Broadening your topic coverage helps build a well-rounded skill profile and prepares you for diverse interview questions.',
            topics: untriedTopics.slice(0, 3),
            suggestedProblems: newTopicProblems,
            priority: 'medium',
          }),
        });
      }
    }

    // 4. Difficulty Progression
    const solvedByDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
    const solvedProblemIds = new Set();
    for (const sub of submissions) {
      if (sub.result === 'accepted' && !solvedProblemIds.has(sub.problem.id)) {
        solvedProblemIds.add(sub.problem.id);
        if (solvedByDifficulty[sub.problem.difficulty] !== undefined) {
          solvedByDifficulty[sub.problem.difficulty]++;
        }
      }
    }

    if (solvedByDifficulty.Easy >= 5 && solvedByDifficulty.Medium < 3) {
      recommendations.push({
        userId,
        recommendationType: RECOMMENDATION_TYPES.GENERAL,
        content: JSON.stringify({
          type: 'difficulty_progression',
          message: 'Great progress on Easy problems! Time to tackle Medium difficulty.',
          explanation: `You've solved ${solvedByDifficulty.Easy} Easy problems. Medium problems will strengthen your algorithmic thinking and prepare you for technical interviews.`,
          currentLevel: 'Easy', suggestedLevel: 'Medium',
          easySolved: solvedByDifficulty.Easy,
          priority: 'medium',
        }),
      });
    } else if (solvedByDifficulty.Medium >= 10 && solvedByDifficulty.Hard < 3) {
      recommendations.push({
        userId,
        recommendationType: RECOMMENDATION_TYPES.GENERAL,
        content: JSON.stringify({
          type: 'difficulty_progression',
          message: 'Strong Medium performance! Challenge yourself with Hard problems.',
          explanation: `With ${solvedByDifficulty.Medium} Medium problems solved, you're ready for advanced challenges that top companies ask in interviews.`,
          currentLevel: 'Medium', suggestedLevel: 'Hard',
          mediumSolved: solvedByDifficulty.Medium,
          priority: 'medium',
        }),
      });
    }

    // 5. Material Recommendations — for weak topics
    if (weakTopics.length > 0) {
      try {
        const weakTopicNames = weakTopics.slice(0, 3).map(t => t.topic);
        const materials = await prisma.material.findMany({
          where: {
            topic: { in: weakTopicNames },
            isArchived: false,
          },
          take: 5,
          select: { id: true, title: true, topic: true, difficulty: true, articleUrl: true, youtubeUrl: true, pdfUrl: true },
        });

        if (materials.length > 0) {
          recommendations.push({
            userId,
            recommendationType: 'material',
            content: JSON.stringify({
              type: 'learning_material',
              message: `Study materials available for your weak areas: ${weakTopicNames.join(', ')}`,
              explanation: 'These curated resources target your weakest topics and provide structured learning paths.',
              materials,
              priority: 'medium',
            }),
          });
        }
      } catch (err) {
        // Material table might not have data yet — safe to ignore
        console.log('[RecService] Material fetch skipped:', err.message);
      }
    }

    // 6. Interview Recommendations
    if (interviews.length === 0) {
      recommendations.push({
        userId,
        recommendationType: RECOMMENDATION_TYPES.INTERVIEW,
        content: JSON.stringify({
          type: 'first_interview',
          message: 'Start your first mock interview to build confidence!',
          explanation: 'Mock interviews are the fastest way to improve communication skills and reduce anxiety in real interviews.',
          suggestedType: 'behavioral', suggestedDifficulty: 'Easy',
          priority: 'medium',
        }),
      });
    } else {
      const avgScore = interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length;
      const avgConfidence = interviews
        .filter(i => i.confidenceScore !== null)
        .reduce((sum, i) => sum + i.confidenceScore, 0) / (interviews.filter(i => i.confidenceScore !== null).length || 1);

      if (avgScore < 60) {
        recommendations.push({
          userId,
          recommendationType: RECOMMENDATION_TYPES.INTERVIEW,
          content: JSON.stringify({
            type: 'improve_score',
            message: `Your average interview score is ${Math.round(avgScore)}. Practice more to improve!`,
            explanation: 'Focus on structuring your answers clearly and providing specific examples from past experience.',
            averageScore: Math.round(avgScore),
            suggestedType: 'behavioral', suggestedDifficulty: 'Easy',
            priority: 'high',
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
            explanation: 'Confidence improves with repetition. Try recording yourself and reviewing your body language.',
            averageConfidence: Math.round(avgConfidence),
            tips: [
              'Practice with the camera on to get comfortable',
              'Prepare stories using the STAR method',
              'Slow down your speaking pace',
            ],
            priority: 'medium',
          }),
        });
      }

      // Untried interview types
      const typeCounts = {};
      for (const interview of interviews) typeCounts[interview.interviewType] = (typeCounts[interview.interviewType] || 0) + 1;
      const allTypes = ['behavioral', 'technical', 'system_design', 'coding', 'hr'];
      const untriedTypes = allTypes.filter(t => !typeCounts[t]);
      if (untriedTypes.length > 0) {
        recommendations.push({
          userId,
          recommendationType: RECOMMENDATION_TYPES.INTERVIEW,
          content: JSON.stringify({
            type: 'try_new_type',
            message: `Try a ${untriedTypes[0]} interview to round out your preparation.`,
            explanation: `You haven't practiced ${untriedTypes[0]} interviews yet. Diversifying your practice helps you handle any interview format.`,
            suggestedType: untriedTypes[0],
            triedTypes: Object.keys(typeCounts),
            priority: 'low',
          }),
        });
      }
    }

    // 7. Streak & Activity
    if (user.streak < 3) {
      recommendations.push({
        userId,
        recommendationType: RECOMMENDATION_TYPES.GENERAL,
        content: JSON.stringify({
          type: 'build_streak',
          message: `Current streak: ${user.streak} days. Solve at least one problem daily!`,
          explanation: 'Consistent daily practice is more effective than occasional marathon sessions. Even one problem per day builds muscle memory.',
          currentStreak: user.streak, target: 7,
          priority: 'low',
        }),
      });
    } else if (user.streak >= 7 && user.streak < 30) {
      recommendations.push({
        userId,
        recommendationType: RECOMMENDATION_TYPES.GENERAL,
        content: JSON.stringify({
          type: 'maintain_streak',
          message: `Excellent ${user.streak}-day streak! Keep going for 30 days!`,
          explanation: 'Research shows 30 consecutive days of practice creates lasting habits. You\'re well on your way!',
          currentStreak: user.streak, target: 30,
          priority: 'low',
        }),
      });
    }

    // 8. Adaptive Recovery — if strong topics exist, recommend advancement
    if (strongTopics && strongTopics.length > 0) {
      const strongNames = strongTopics.slice(0, 2).map(t => t.topic);
      const advancedProblems = await prisma.problem.findMany({
        where: {
          topic: { in: strongNames },
          difficulty: 'Hard',
          isArchived: false,
          id: { notIn: [...solvedProblemIds].length > 0 ? [...solvedProblemIds] : [0] },
        },
        take: 3,
        select: { id: true, title: true, topic: true, difficulty: true },
      });

      if (advancedProblems.length > 0) {
        recommendations.push({
          userId,
          recommendationType: RECOMMENDATION_TYPES.PROBLEM,
          content: JSON.stringify({
            type: 'advanced_challenge',
            message: `You're excelling in ${strongNames.join(', ')}! Try these advanced challenges.`,
            explanation: 'Strong performance in these topics means you\'re ready for harder challenges that will push your skills further.',
            suggestedProblems: advancedProblems,
            difficulty: 'Hard',
            priority: 'low',
          }),
        });
      }
    }

    // 9. Save Recommendations (replace old ones)
    if (recommendations.length > 0) {
      await prisma.recommendation.deleteMany({ where: { userId } });
      await prisma.recommendation.createMany({ data: recommendations });
    }

    return recommendations.map(r => ({
      ...r,
      content: JSON.parse(r.content),
    }));
  } catch (err) {
    console.error('[RecService] Generation failed (graceful fallback):', err.message);
    // Never crash — return empty
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════
// GET CACHED RECOMMENDATIONS (fast read, no recalculation)
// ═══════════════════════════════════════════════════════════════

const getRecommendations = async (userId) => {
  try {
    const recs = await prisma.recommendation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return recs.map(r => {
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
  } catch (err) {
    console.error('[RecService] Get failed (graceful fallback):', err.message);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════
// WEAK TOPICS API (delegates to engine)
// ═══════════════════════════════════════════════════════════════

const getWeakTopics = async (userId) => {
  return await weakTopicEngine.getCachedWeakTopics(userId);
};

const getRecommendationAnalytics = async (userId) => {
  try {
    const latest = await prisma.recommendationAnalytics.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return latest;
  } catch (err) {
    console.error('[RecService] Analytics fetch failed:', err.message);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getAdaptiveDifficulty(accuracy, skillLevel, totalSubmissions) {
  if (totalSubmissions < 5) return 'Easy';
  if (skillLevel === 'expert' || accuracy >= 80) return 'Hard';
  if (skillLevel === 'advanced' || accuracy >= 60) return 'Medium';
  if (skillLevel === 'intermediate' || accuracy >= 40) return 'Medium';
  return 'Easy';
}

module.exports = { generateRecommendations, getRecommendations, getWeakTopics, getRecommendationAnalytics };
