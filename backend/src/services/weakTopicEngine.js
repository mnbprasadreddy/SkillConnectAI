// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Weak Topic Engine (READ-ONLY Analysis)
// Analyzes user performance across problems, contests, interviews.
// NEVER mutates submissions, contests, interviews, or materials.
// Writes ONLY to WeakTopic + RecommendationAnalytics tables.
// Tolerates missing data gracefully — no crashes on empty sets.
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const { calcPercentage } = require('../utils/helpers');

// ─── Scoring weights ────────────────────────────────────────────
const WEIGHTS = {
  acceptedRate: 0.40,
  contestPerformance: 0.20,
  interviewPerformance: 0.20,
  consistency: 0.10,
  optimization: 0.10,
};

// ─── Severity thresholds ────────────────────────────────────────
function classifySeverity(score) {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'weak';
  return 'critical';
}

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS — Orchestrates all sub-analyses per user
// ═══════════════════════════════════════════════════════════════

async function analyzeUser(userId) {
  try {
    // 1. Gather all data in parallel (READ-ONLY)
    const [submissions, contestSubs, interviews, user] = await Promise.all([
      prisma.submission.findMany({
        where: { userId },
        include: { problem: { select: { id: true, topic: true, difficulty: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contestSubmission.findMany({
        where: { userId },
        include: { contest: { select: { id: true, title: true } } },
      }),
      prisma.interview.findMany({
        where: { userId, status: 'completed' },
        select: {
          id: true, score: true, technicalScore: true,
          codingScore: true, communicationScore: true,
          interviewType: true, createdAt: true,
        },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, accuracy: true, skillLevel: true } }),
    ]);

    if (!user) return { topicScores: {}, weakTopics: [], strongTopics: [] };

    // 2. Compute sub-scores per topic
    const problemAnalysis = analyzeProblemPerformance(submissions);
    const contestAnalysis = analyzeContestPerformance(contestSubs);
    const interviewAnalysis = analyzeInterviewPerformance(interviews);
    const optimizationAnalysis = analyzeOptimization(submissions);
    const consistencyAnalysis = analyzeConsistency(submissions);

    // 3. Merge topics ONLY from problem analysis (contest is global, not per-topic)
    const allTopics = new Set(Object.keys(problemAnalysis));

    // Get global contest score (applies uniformly to all topics)
    const globalContestScore = contestAnalysis.__global?.score ?? 50;

    // 4. Compute final weighted score per topic
    const topicScores = {};
    for (const topic of allTopics) {
      const accepted = problemAnalysis[topic]?.acceptedRate ?? 50;
      const contest = globalContestScore;
      const interview = interviewAnalysis.globalScore ?? 50;
      const opt = optimizationAnalysis[topic]?.score ?? 50;
      const cons = consistencyAnalysis[topic]?.score ?? 50;

      const finalScore = Math.round(
        accepted * WEIGHTS.acceptedRate +
        contest * WEIGHTS.contestPerformance +
        interview * WEIGHTS.interviewPerformance +
        cons * WEIGHTS.consistency +
        opt * WEIGHTS.optimization
      );

      topicScores[topic] = {
        score: Math.max(0, Math.min(100, finalScore)),
        severity: classifySeverity(finalScore),
        acceptedRate: Math.round(accepted),
        contestScore: Math.round(contest),
        interviewScore: Math.round(interview),
        consistency: Math.round(cons),
        optimizationScore: Math.round(opt),
        attempts: problemAnalysis[topic]?.total ?? 0,
        solved: problemAnalysis[topic]?.accepted ?? 0,
      };
    }

    // 5. Persist to WeakTopic table (upsert safely)
    await persistTopicScores(userId, topicScores);

    // 6. Snapshot to RecommendationAnalytics (non-blocking)
    saveAnalyticsSnapshot(userId, topicScores).catch(err =>
      console.error('[WeakTopicEngine] Analytics snapshot failed (non-blocking):', err.message)
    );

    // 7. Build sorted output
    const sorted = Object.entries(topicScores)
      .map(([topic, data]) => ({ topic, ...data }))
      .sort((a, b) => a.score - b.score);

    return {
      topicScores,
      weakTopics: sorted.filter(t => t.severity === 'critical' || t.severity === 'weak'),
      strongTopics: sorted.filter(t => t.severity === 'strong'),
      moderateTopics: sorted.filter(t => t.severity === 'moderate'),
      allTopics: sorted,
    };
  } catch (err) {
    console.error('[WeakTopicEngine] Analysis failed (graceful fallback):', err.message);
    return { topicScores: {}, weakTopics: [], strongTopics: [], allTopics: [] };
  }
}

// ═══════════════════════════════════════════════════════════════
// SUB-ANALYZERS (all READ-ONLY)
// ═══════════════════════════════════════════════════════════════

/**
 * Problem performance: accepted rate per topic
 */
function analyzeProblemPerformance(submissions) {
  const stats = {};
  for (const sub of submissions) {
    const t = sub.problem?.topic;
    if (!t) continue;
    if (!stats[t]) stats[t] = { total: 0, accepted: 0, problems: new Set(), recentFails: 0 };
    stats[t].total++;
    stats[t].problems.add(sub.problem.id);
    if (sub.result === 'accepted') stats[t].accepted++;
    else stats[t].recentFails++;
  }

  const result = {};
  for (const [topic, s] of Object.entries(stats)) {
    result[topic] = {
      total: s.total,
      accepted: s.accepted,
      acceptedRate: s.total > 0 ? calcPercentage(s.accepted, s.total) : 50,
      uniqueProblems: s.problems.size,
      recentFails: s.recentFails,
    };
  }
  return result;
}

/**
 * Contest performance: topic-level scoring from contest submissions
 * Since ContestSubmission has score + solvedCount (not per-topic),
 * we derive a global contest engagement score.
 */
function analyzeContestPerformance(contestSubs) {
  if (!contestSubs || contestSubs.length === 0) return {};

  const totalContests = contestSubs.length;
  const avgScore = contestSubs.reduce((s, c) => s + (c.score || 0), 0) / totalContests;
  const avgSolved = contestSubs.reduce((s, c) => s + (c.solvedCount || 0), 0) / totalContests;

  // Normalize: avgScore could be 0-1000+ depending on contest. Cap at 100.
  const normalized = Math.min(100, Math.round((avgScore / Math.max(totalContests, 1)) * 10 + avgSolved * 15));

  // Return as global contest score — we don't have per-topic contest data
  // The engine applies this uniformly across topics
  return { __global: { score: Math.max(0, Math.min(100, normalized)) } };
}

/**
 * Interview performance: averaged scores across completed interviews
 */
function analyzeInterviewPerformance(interviews) {
  if (!interviews || interviews.length === 0) return { globalScore: 50 };

  const scores = interviews.filter(i => i.score !== null).map(i => i.score);
  const techScores = interviews.filter(i => i.technicalScore !== null).map(i => i.technicalScore);
  const codeScores = interviews.filter(i => i.codingScore !== null).map(i => i.codingScore);

  const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 50;

  return {
    globalScore: Math.round(avg(scores)),
    technicalAvg: Math.round(avg(techScores)),
    codingAvg: Math.round(avg(codeScores)),
  };
}

/**
 * Optimization: detect TLE/MLE patterns indicating brute-force approaches
 */
function analyzeOptimization(submissions) {
  const stats = {};
  for (const sub of submissions) {
    const t = sub.problem?.topic;
    if (!t) continue;
    if (!stats[t]) stats[t] = { total: 0, tle: 0, mle: 0 };
    stats[t].total++;
    if (sub.result === 'time_limit_exceeded') stats[t].tle++;
    if (sub.result === 'memory_limit_exceeded') stats[t].mle++;
  }

  const result = {};
  for (const [topic, s] of Object.entries(stats)) {
    const inefficiency = s.total > 0 ? ((s.tle + s.mle) / s.total) : 0;
    // Higher score = better optimization (invert the inefficiency ratio)
    result[topic] = { score: Math.round((1 - inefficiency) * 100) };
  }
  return result;
}

/**
 * Consistency: how regularly the user practices each topic
 */
function analyzeConsistency(submissions) {
  const stats = {};
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  for (const sub of submissions) {
    const t = sub.problem?.topic;
    if (!t) continue;
    if (!stats[t]) stats[t] = { total: 0, recent: 0, days: new Set() };
    stats[t].total++;
    const subTime = new Date(sub.createdAt).getTime();
    if (now - subTime < thirtyDays) {
      stats[t].recent++;
      stats[t].days.add(new Date(sub.createdAt).toISOString().split('T')[0]);
    }
  }

  const result = {};
  for (const [topic, s] of Object.entries(stats)) {
    // Score based on: has recent activity + unique days practicing
    const daySpread = Math.min(s.days.size / 10, 1); // 10 unique days = 100%
    const recentRatio = s.total > 0 ? Math.min(s.recent / s.total, 1) : 0;
    result[topic] = { score: Math.round((daySpread * 0.6 + recentRatio * 0.4) * 100) };
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE (safe upserts — never destructive)
// ═══════════════════════════════════════════════════════════════

async function persistTopicScores(userId, topicScores) {
  try {
    const upserts = Object.entries(topicScores).map(([topic, data]) =>
      prisma.weakTopic.upsert({
        where: { userId_topic: { userId, topic } },
        update: {
          score: data.score,
          severity: data.severity,
          acceptedRate: data.acceptedRate,
          contestScore: data.contestScore,
          interviewScore: data.interviewScore,
          consistency: data.consistency,
          optimizationScore: data.optimizationScore,
        },
        create: {
          userId, topic,
          score: data.score,
          severity: data.severity,
          acceptedRate: data.acceptedRate,
          contestScore: data.contestScore,
          interviewScore: data.interviewScore,
          consistency: data.consistency,
          optimizationScore: data.optimizationScore,
        },
      })
    );
    await prisma.$transaction(upserts);
  } catch (err) {
    console.error('[WeakTopicEngine] Persist failed (non-blocking):', err.message);
  }
}

async function saveAnalyticsSnapshot(userId, topicScores) {
  const data = Object.entries(topicScores).map(([topic, d]) => ({
    userId, topic,
    acceptedRate: d.acceptedRate,
    contestScore: d.contestScore,
    interviewScore: d.interviewScore,
    optimization: d.optimizationScore,
    consistency: d.consistency,
    finalScore: d.score,
  }));
  if (data.length > 0) {
    await prisma.recommendationAnalytics.createMany({ data });
  }
}

// ═══════════════════════════════════════════════════════════════
// READ CACHED WEAK TOPICS (fast, no recalculation)
// ═══════════════════════════════════════════════════════════════

async function getCachedWeakTopics(userId) {
  try {
    const topics = await prisma.weakTopic.findMany({
      where: { userId },
      orderBy: { score: 'asc' },
    });
    return {
      allTopics: topics,
      weakTopics: topics.filter(t => t.severity === 'critical' || t.severity === 'weak'),
      strongTopics: topics.filter(t => t.severity === 'strong'),
    };
  } catch (err) {
    console.error('[WeakTopicEngine] Cache read failed:', err.message);
    return { allTopics: [], weakTopics: [], strongTopics: [] };
  }
}

module.exports = { analyzeUser, getCachedWeakTopics };
