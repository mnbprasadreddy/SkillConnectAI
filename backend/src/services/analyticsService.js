// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Analytics Service (v2)
// Complete dashboard: coding stats, interview trends, mastery, streaks
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const { calcPercentage } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get dashboard overview for a user
 */
const getDashboardOverview = async (userId) => {
  const [
    user,
    totalSubmissions,
    acceptedSubmissions,
    totalInterviews,
    completedInterviews,
    recentSubmissions,
    recentInterviews,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.submission.count({ where: { userId } }),
    prisma.submission.count({ where: { userId, result: 'accepted' } }),
    prisma.interview.count({ where: { userId } }),
    prisma.interview.count({ where: { userId, status: 'completed' } }),
    prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        problem: { select: { title: true, difficulty: true, topic: true } },
      },
    }),
    prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        interviewType: true,
        difficulty: true,
        score: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  // Count distinct solved problems
  const solvedProblems = await prisma.submission.findMany({
    where: { userId, result: 'accepted' },
    select: { problemId: true },
    distinct: ['problemId'],
  });

  // Total available problems
  const totalProblems = await prisma.problem.count();

  return {
    user: {
      name: user.name,
      email: user.email,
      skillLevel: user.skillLevel,
      streak: user.streak,
      accuracy: user.accuracy,
      profileImage: user.profileImage,
    },
    stats: {
      totalSubmissions,
      acceptedSubmissions,
      accuracy: calcPercentage(acceptedSubmissions, totalSubmissions),
      problemsSolved: solvedProblems.length,
      totalProblems,
      completionRate: calcPercentage(solvedProblems.length, totalProblems),
      totalInterviews,
      completedInterviews,
    },
    recentSubmissions: recentSubmissions.map((s) => ({
      id: s.id,
      problem: s.problem.title,
      difficulty: s.problem.difficulty,
      topic: s.problem.topic,
      result: s.result,
      language: s.language,
      runtime: s.runtime,
      date: s.createdAt,
    })),
    recentInterviews,
  };
};

/**
 * Get coding performance stats with difficulty and topic breakdowns
 */
const getCodingStats = async (userId) => {
  const submissions = await prisma.submission.findMany({
    where: { userId },
    include: {
      problem: { select: { id: true, difficulty: true, topic: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Distinct solved problems for accurate difficulty breakdown
  const solvedProblemIds = new Set();
  const solvedByDifficulty = { Easy: new Set(), Medium: new Set(), Hard: new Set() };
  const attemptedByDifficulty = { Easy: new Set(), Medium: new Set(), Hard: new Set() };

  // Group by difficulty
  const byDifficulty = { Easy: { total: 0, accepted: 0 }, Medium: { total: 0, accepted: 0 }, Hard: { total: 0, accepted: 0 } };

  // Group by topic
  const byTopic = {};

  // Verdict breakdown
  const verdicts = { accepted: 0, wrong_answer: 0, runtime_error: 0, compilation_error: 0, time_limit_exceeded: 0, other: 0 };

  // Language breakdown
  const byLanguage = {};

  for (const sub of submissions) {
    const diff = sub.problem.difficulty;
    const topic = sub.problem.topic;
    const lang = sub.language;

    // Difficulty stats
    if (byDifficulty[diff]) {
      byDifficulty[diff].total++;
      attemptedByDifficulty[diff].add(sub.problem.id);
      if (sub.result === 'accepted') {
        byDifficulty[diff].accepted++;
        solvedByDifficulty[diff].add(sub.problem.id);
        solvedProblemIds.add(sub.problem.id);
      }
    }

    // Topic stats
    if (!byTopic[topic]) byTopic[topic] = { total: 0, accepted: 0, solved: new Set(), attempted: new Set() };
    byTopic[topic].total++;
    byTopic[topic].attempted.add(sub.problem.id);
    if (sub.result === 'accepted') {
      byTopic[topic].accepted++;
      byTopic[topic].solved.add(sub.problem.id);
    }

    // Verdict stats
    if (verdicts[sub.result] !== undefined) verdicts[sub.result]++;
    else verdicts.other++;

    // Language stats
    if (!byLanguage[lang]) byLanguage[lang] = 0;
    byLanguage[lang]++;
  }

  // Calculate topic performance with mastery levels
  const topicPerformance = Object.entries(byTopic).map(([topic, stats]) => {
    const accuracy = calcPercentage(stats.accepted, stats.total);
    return {
      topic,
      totalSubmissions: stats.total,
      accepted: stats.accepted,
      problemsSolved: stats.solved.size,
      problemsAttempted: stats.attempted.size,
      accuracy,
      mastery: getMasteryLevel(accuracy, stats.solved.size),
    };
  });

  topicPerformance.sort((a, b) => a.accuracy - b.accuracy);

  // Difficulty breakdown with solved counts
  const difficultyBreakdown = Object.entries(byDifficulty).map(([level, stats]) => ({
    difficulty: level,
    totalSubmissions: stats.total,
    accepted: stats.accepted,
    problemsSolved: solvedByDifficulty[level].size,
    problemsAttempted: attemptedByDifficulty[level].size,
    accuracy: calcPercentage(stats.accepted, stats.total),
  }));

  // Submission trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSubs = submissions.filter((s) => new Date(s.createdAt) >= thirtyDaysAgo);
  const dailyCounts = {};
  for (const sub of recentSubs) {
    const day = new Date(sub.createdAt).toISOString().split('T')[0];
    if (!dailyCounts[day]) dailyCounts[day] = { total: 0, accepted: 0 };
    dailyCounts[day].total++;
    if (sub.result === 'accepted') dailyCounts[day].accepted++;
  }
  const submissionTrend = Object.entries(dailyCounts)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalSubmissions: submissions.length,
    acceptedSubmissions: submissions.filter((s) => s.result === 'accepted').length,
    problemsSolved: solvedProblemIds.size,
    difficultyBreakdown,
    topicPerformance,
    weakTopics: topicPerformance.filter((t) => t.accuracy < 50).slice(0, 5),
    strongTopics: topicPerformance.filter((t) => t.accuracy >= 70).slice(0, 5),
    verdicts,
    languageBreakdown: Object.entries(byLanguage).map(([lang, count]) => ({ language: lang, count })),
    submissionTrend,
  };
};

/**
 * Get mastery level based on accuracy and solved count
 */
function getMasteryLevel(accuracy, solvedCount) {
  if (solvedCount >= 10 && accuracy >= 80) return 'mastered';
  if (solvedCount >= 5 && accuracy >= 60) return 'proficient';
  if (solvedCount >= 2 && accuracy >= 40) return 'learning';
  if (solvedCount >= 1) return 'beginner';
  return 'not_started';
}

/**
 * Get interview performance stats
 */
const getInterviewStats = async (userId) => {
  const interviews = await prisma.interview.findMany({
    where: { userId, status: 'completed' },
    include: { analytics: true },
    orderBy: { createdAt: 'desc' },
  });

  if (interviews.length === 0) {
    return {
      totalInterviews: 0,
      averageScore: 0,
      averageConfidence: 0,
      averageCommunication: 0,
      averageTechnical: 0,
      byType: {},
      trend: [],
      analyticsOverview: null,
    };
  }

  const avg = (arr) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : 0;

  const scores = interviews.filter((i) => i.score !== null).map((i) => i.score);
  const confidences = interviews.filter((i) => i.confidenceScore !== null).map((i) => i.confidenceScore);
  const communications = interviews.filter((i) => i.communicationScore !== null).map((i) => i.communicationScore);
  const technicals = interviews.filter((i) => i.technicalScore !== null).map((i) => i.technicalScore);

  // By type breakdown
  const byType = {};
  for (const interview of interviews) {
    const type = interview.interviewType;
    if (!byType[type]) byType[type] = { count: 0, scores: [], confidences: [] };
    byType[type].count++;
    if (interview.score !== null) byType[type].scores.push(interview.score);
    if (interview.confidenceScore !== null) byType[type].confidences.push(interview.confidenceScore);
  }

  const typeBreakdown = Object.entries(byType).map(([type, data]) => ({
    type,
    count: data.count,
    averageScore: avg(data.scores),
    averageConfidence: avg(data.confidences),
  }));

  // Trend data (last 20 interviews)
  const trend = interviews.slice(0, 20).map((i) => ({
    id: i.id,
    date: i.createdAt,
    score: i.score,
    confidenceScore: i.confidenceScore,
    type: i.interviewType,
    difficulty: i.difficulty,
  }));

  // Analytics overview from latest interviews
  const interviewsWithAnalytics = interviews.filter((i) => i.analytics);
  const analyticsOverview = interviewsWithAnalytics.length > 0 ? {
    averageEyeContact: avg(interviewsWithAnalytics.map((i) => i.analytics.eyeContactScore).filter(Boolean)),
    averagePosture: avg(interviewsWithAnalytics.map((i) => i.analytics.postureScore).filter(Boolean)),
    averageSpeechClarity: avg(interviewsWithAnalytics.map((i) => i.analytics.speechClarity).filter(Boolean)),
    averageNervousness: avg(interviewsWithAnalytics.map((i) => i.analytics.nervousnessScore).filter(Boolean)),
    averageSpeakingSpeed: avg(interviewsWithAnalytics.map((i) => i.analytics.speakingSpeed).filter(Boolean)),
  } : null;

  return {
    totalInterviews: interviews.length,
    averageScore: avg(scores),
    averageConfidence: avg(confidences),
    averageCommunication: avg(communications),
    averageTechnical: avg(technicals),
    typeBreakdown,
    trend,
    analyticsOverview,
  };
};

/**
 * Get recent activity for a user (merged timeline)
 */
const getRecentActivity = async (userId, limit = 20) => {
  const [submissions, interviews] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        problem: { select: { title: true, difficulty: true, topic: true } },
      },
    }),
    prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        interviewType: true,
        difficulty: true,
        score: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  // Merge and sort by date
  const activities = [
    ...submissions.map((s) => ({
      type: 'submission',
      id: s.id,
      title: s.problem.title,
      difficulty: s.problem.difficulty,
      topic: s.problem.topic,
      result: s.result,
      language: s.language,
      runtime: s.runtime,
      date: s.createdAt,
    })),
    ...interviews.map((i) => ({
      type: 'interview',
      id: i.id,
      title: `${i.interviewType.charAt(0).toUpperCase() + i.interviewType.slice(1)} Interview`,
      difficulty: i.difficulty,
      score: i.score,
      status: i.status,
      date: i.createdAt,
    })),
  ];

  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  return activities.slice(0, limit);
};

/**
 * Get topic-level performance analysis
 */
const getTopicPerformance = async (userId) => {
  const stats = await getCodingStats(userId);
  return stats.topicPerformance;
};

/**
 * Get heatmap data (daily submission counts for the last year)
 */
const getHeatmapData = async (userId) => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const submissions = await prisma.submission.findMany({
    where: {
      userId,
      createdAt: { gte: oneYearAgo },
    },
    select: { createdAt: true, result: true },
    orderBy: { createdAt: 'asc' },
  });

  const heatmap = {};
  for (const sub of submissions) {
    const day = new Date(sub.createdAt).toISOString().split('T')[0];
    if (!heatmap[day]) heatmap[day] = { count: 0, accepted: 0 };
    heatmap[day].count++;
    if (sub.result === 'accepted') heatmap[day].accepted++;
  }

  return Object.entries(heatmap).map(([date, data]) => ({
    date,
    count: data.count,
    accepted: data.accepted,
    level: data.count >= 5 ? 4 : data.count >= 3 ? 3 : data.count >= 2 ? 2 : data.count >= 1 ? 1 : 0,
  }));
};

module.exports = {
  getDashboardOverview,
  getCodingStats,
  getInterviewStats,
  getRecentActivity,
  getTopicPerformance,
  getHeatmapData,
};
