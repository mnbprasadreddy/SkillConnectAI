// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Submission Service (v2)
// Complete submission pipeline: run → evaluate → verdict → stats
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const judge0Service = require('./judge0Service');
const problemService = require('./problemService');
const userService = require('./userService');
const logger = require('../utils/logger');

/**
 * Run code without saving (playground mode)
 * Returns stdout, stderr, runtime, memory
 */
const runCode = async (language, sourceCode, input = '') => {
  const result = await judge0Service.runCode(language, sourceCode, input);
  return {
    statusId: result.statusId,
    status: result.statusDescription,
    result: result.result,
    stdout: result.stdout,
    stderr: result.stderr,
    compileOutput: result.compileOutput,
    runtime: result.runtime,
    runtimeMs: result.runtimeMs,
    memory: result.memory,
  };
};

/**
 * Submit code for a problem — full pipeline
 * Flow: validate → create pending → Judge0 batch → verdict → save → update stats
 */
const submitCode = async (userId, problemId, language, sourceCode) => {
  // 1. Verify problem exists
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { id: true, title: true, difficulty: true, topic: true },
  });

  if (!problem) {
    throw Object.assign(new Error('Problem not found'), { statusCode: 404 });
  }

  // 2. Get ALL test cases (including hidden)
  const testCases = await problemService.getAllTestCases(problemId);

  if (testCases.length === 0) {
    throw Object.assign(new Error('No test cases found for this problem'), { statusCode: 400 });
  }

  // 3. Create submission record (pending)
  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId,
      language,
      sourceCode,
      result: 'pending',
    },
  });

  try {
    // 4. Evaluate against all test cases via Judge0
    const results = await judge0Service.batchEvaluate(
      language,
      sourceCode,
      testCases,
      problem.difficulty
    );

    // 5. Determine overall verdict
    const verdict = determineVerdict(results);

    // 6. Aggregate best runtime/memory across passing tests
    const passingResults = results.filter((r) => r.passed);
    const maxRuntime = passingResults.length > 0
      ? passingResults.reduce((best, r) => r.runtime && (!best || parseFloat(r.runtime) > parseFloat(best)) ? r.runtime : best, null)
      : results[0]?.runtime || null;
    const maxMemory = passingResults.length > 0
      ? passingResults.reduce((best, r) => r.memory && (!best || parseFloat(r.memory) > parseFloat(best)) ? r.memory : best, null)
      : results[0]?.memory || null;

    // 7. Update submission with results
    const updatedSubmission = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        result: verdict.overallResult,
        runtime: maxRuntime,
        memory: maxMemory,
        stdout: formatTestResultsSummary(results),
        stderr: verdict.firstError || null,
      },
    });

    // 8. Update user stats (accuracy, streak, skill level)
    await Promise.all([
      userService.updateAccuracy(userId),
      userService.updateStreak(userId),
      updateUserSkillLevel(userId),
    ]);

    // 9. Background: trigger recommendation refresh (non-blocking)
    triggerRecommendationRefresh(userId).catch((err) => {
      logger.warn('Background recommendation refresh failed:', err.message);
    });

    // 10. Return detailed response
    return {
      submission: {
        id: updatedSubmission.id,
        problemId,
        problemTitle: problem.title,
        language,
        result: verdict.overallResult,
        runtime: maxRuntime,
        memory: maxMemory,
        createdAt: updatedSubmission.createdAt,
      },
      testResults: results.map((r) => ({
        testCaseId: r.testCaseId,
        passed: r.passed,
        isHidden: r.isHidden,
        // Only show actual output for non-hidden test cases
        ...(r.isHidden
          ? { result: r.passed ? 'passed' : 'failed' }
          : {
              actualOutput: r.actualOutput,
              expectedOutput: r.expectedOutput,
              result: r.result,
            }),
        runtime: r.runtime,
        memory: r.memory,
        error: r.isHidden ? null : r.error,
      })),
      summary: {
        totalTests: results.length,
        passed: verdict.passedCount,
        failed: verdict.failedCount,
        hiddenTests: results.filter((r) => r.isHidden).length,
        hiddenPassed: results.filter((r) => r.isHidden && r.passed).length,
        overallResult: verdict.overallResult,
        verdictMessage: verdict.message,
      },
    };
  } catch (error) {
    // Update submission as error
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        result: 'runtime_error',
        stderr: error.message,
      },
    });

    throw error;
  }
};

/**
 * Determine overall verdict from test case results
 */
function determineVerdict(results) {
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  const allPassed = failedCount === 0;

  if (allPassed) {
    return {
      overallResult: 'accepted',
      passedCount,
      failedCount,
      firstError: null,
      message: `All ${passedCount} test cases passed!`,
    };
  }

  // Find first failure to determine error type
  const firstFailure = results.find((r) => !r.passed);
  let overallResult = firstFailure?.result || 'wrong_answer';

  // Priority: compilation_error > runtime_error > time_limit > wrong_answer
  const hasCompileError = results.some((r) => r.result === 'compilation_error');
  const hasRuntimeError = results.some((r) => r.result === 'runtime_error');
  const hasTLE = results.some((r) => r.result === 'time_limit_exceeded');

  if (hasCompileError) overallResult = 'compilation_error';
  else if (hasRuntimeError) overallResult = 'runtime_error';
  else if (hasTLE) overallResult = 'time_limit_exceeded';
  else overallResult = 'wrong_answer';

  const messages = {
    compilation_error: 'Code failed to compile',
    runtime_error: 'Runtime error encountered',
    time_limit_exceeded: 'Time limit exceeded',
    wrong_answer: `${failedCount} test case(s) failed`,
    memory_limit_exceeded: 'Memory limit exceeded',
  };

  return {
    overallResult,
    passedCount,
    failedCount,
    firstError: firstFailure?.error || null,
    message: messages[overallResult] || `${passedCount}/${results.length} test cases passed`,
  };
}

/**
 * Format test results as a readable summary for stdout column
 */
function formatTestResultsSummary(results) {
  return results
    .map((r, i) => {
      const label = r.isHidden ? `Hidden TC${i + 1}` : `TC${i + 1}`;
      const status = r.passed ? '✓ PASS' : '✗ FAIL';
      const time = r.runtime ? ` (${r.runtime})` : '';
      return `${label}: ${status}${time}`;
    })
    .join('\n');
}

/**
 * Auto-update user skill level based on solved problems
 */
async function updateUserSkillLevel(userId) {
  try {
    const solvedProblems = await prisma.submission.findMany({
      where: { userId, result: 'accepted' },
      select: { problemId: true, problem: { select: { difficulty: true } } },
      distinct: ['problemId'],
    });

    const total = solvedProblems.length;
    const hardSolved = solvedProblems.filter((s) => s.problem.difficulty === 'Hard').length;
    const mediumSolved = solvedProblems.filter((s) => s.problem.difficulty === 'Medium').length;

    let skillLevel = 'beginner';
    if (total >= 50 && hardSolved >= 10) skillLevel = 'expert';
    else if (total >= 25 && (hardSolved >= 5 || mediumSolved >= 15)) skillLevel = 'advanced';
    else if (total >= 10 && mediumSolved >= 5) skillLevel = 'intermediate';

    await prisma.user.update({
      where: { id: userId },
      data: { skillLevel },
    });
  } catch (error) {
    logger.warn('Skill level update failed:', error.message);
  }
}

/**
 * Trigger background recommendation refresh after submission
 */
async function triggerRecommendationRefresh(userId) {
  try {
    const recommendationService = require('./recommendationService');
    await recommendationService.generateRecommendations(userId);
  } catch (error) {
    // Non-critical — don't throw
    logger.warn('Recommendation refresh skipped:', error.message);
  }
}

/**
 * Get submissions by user with pagination
 */
const getSubmissionsByUser = async (userId, { page, limit, offset }) => {
  const [submissions, totalCount] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      include: {
        problem: {
          select: { id: true, title: true, difficulty: true, topic: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.submission.count({ where: { userId } }),
  ]);

  return { submissions, totalCount };
};

/**
 * Get submissions for a specific problem by a user
 */
const getSubmissionsByProblem = async (userId, problemId) => {
  return await prisma.submission.findMany({
    where: { userId, problemId },
    select: {
      id: true,
      language: true,
      result: true,
      runtime: true,
      memory: true,
      stdout: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get submission statistics for a user
 */
const getSubmissionStats = async (userId) => {
  const submissions = await prisma.submission.findMany({
    where: { userId },
    select: { result: true, createdAt: true },
  });

  const total = submissions.length;
  const accepted = submissions.filter((s) => s.result === 'accepted').length;
  const wrongAnswer = submissions.filter((s) => s.result === 'wrong_answer').length;
  const runtimeError = submissions.filter((s) => s.result === 'runtime_error').length;
  const compilationError = submissions.filter((s) => s.result === 'compilation_error').length;
  const tle = submissions.filter((s) => s.result === 'time_limit_exceeded').length;

  // Submission trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSubs = submissions.filter((s) => new Date(s.createdAt) >= thirtyDaysAgo);

  const dailyCounts = {};
  for (const sub of recentSubs) {
    const day = new Date(sub.createdAt).toISOString().split('T')[0];
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  }

  return {
    total,
    accepted,
    wrongAnswer,
    runtimeError,
    compilationError,
    timeLimitExceeded: tle,
    accuracy: total > 0 ? Math.round((accepted / total) * 10000) / 100 : 0,
    trend: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
  };
};

module.exports = {
  runCode,
  submitCode,
  getSubmissionsByUser,
  getSubmissionsByProblem,
  getSubmissionStats,
};
