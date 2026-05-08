// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Judge0 Service (v2)
// Production-grade Judge0 Code Execution Pipeline
// Supports: run, submit, batch evaluate, parallel batch, TLE/MLE
// ═══════════════════════════════════════════════════════════════

const axios = require('axios');
const judge0Config = require('../config/judge0');
const { sleep } = require('../utils/helpers');
const { mapJudge0Status } = require('../utils/constants');
const logger = require('../utils/logger');

// ─── Time/Memory Limits per Difficulty ─────────────────────────
const EXECUTION_LIMITS = {
  Easy: { cpu_time_limit: 5, memory_limit: 256000 },
  Medium: { cpu_time_limit: 10, memory_limit: 512000 },
  Hard: { cpu_time_limit: 15, memory_limit: 512000 },
  default: { cpu_time_limit: 10, memory_limit: 256000 },
};

/**
 * Submit code to Judge0 for execution
 */
const submitCode = async (language, sourceCode, stdin = '', expectedOutput = null, limits = null) => {
  const languageId = judge0Config.getLanguageId(language);
  if (!languageId) {
    throw Object.assign(new Error(`Unsupported language: ${language}. Supported: ${Object.keys(judge0Config.languages).join(', ')}`), { statusCode: 400 });
  }

  const payload = {
    language_id: languageId,
    source_code: Buffer.from(sourceCode).toString('base64'),
    stdin: Buffer.from(stdin || '').toString('base64'),
    cpu_time_limit: limits?.cpu_time_limit || EXECUTION_LIMITS.default.cpu_time_limit,
    memory_limit: limits?.memory_limit || EXECUTION_LIMITS.default.memory_limit,
    ...(expectedOutput && {
      expected_output: Buffer.from(expectedOutput).toString('base64'),
    }),
  };

  try {
    const response = await axios.post(
      `${judge0Config.baseUrl}/submissions?base64_encoded=true&wait=false`,
      payload,
      { headers: judge0Config.getHeaders(), timeout: 10000 }
    );
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.response?.data?.error || error.message;
    logger.error('Judge0 submit error:', msg);
    throw Object.assign(new Error(`Judge0 submission failed: ${msg}`), { statusCode: 502 });
  }
};

/**
 * Get submission result by token (poll until complete)
 */
const getResult = async (token, maxAttempts = 30) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get(
        `${judge0Config.baseUrl}/submissions/${token}?base64_encoded=true&fields=*`,
        { headers: judge0Config.getHeaders(), timeout: 10000 }
      );

      const data = response.data;
      const statusId = data.status?.id;

      // Status 1 = In Queue, 2 = Processing — keep polling
      if (statusId <= 2) {
        await sleep(Math.min(1000 + attempt * 200, 3000));
        continue;
      }

      // Decode base64 outputs safely
      const decodeB64 = (str) => {
        try { return str ? Buffer.from(str, 'base64').toString('utf-8') : null; }
        catch { return str; }
      };

      return {
        statusId,
        statusDescription: data.status?.description,
        result: mapJudge0Status(statusId),
        stdout: decodeB64(data.stdout),
        stderr: decodeB64(data.stderr),
        compileOutput: decodeB64(data.compile_output),
        message: decodeB64(data.message),
        runtime: data.time ? `${data.time}s` : null,
        runtimeMs: data.time ? Math.round(parseFloat(data.time) * 1000) : null,
        memory: data.memory ? `${Math.round(data.memory / 1024 * 100) / 100} MB` : null,
        memoryKb: data.memory || null,
      };
    } catch (error) {
      logger.warn(`Judge0 poll attempt ${attempt + 1}/${maxAttempts} failed:`, error.message);
      if (attempt === maxAttempts - 1) {
        throw Object.assign(new Error('Judge0 polling timed out'), { statusCode: 504 });
      }
      await sleep(1500);
    }
  }

  throw Object.assign(new Error('Judge0 submission timed out after maximum attempts'), { statusCode: 504 });
};

/**
 * Run code (submit + poll for result in one call)
 */
const runCode = async (language, sourceCode, stdin = '', limits = null) => {
  const submission = await submitCode(language, sourceCode, stdin, null, limits);
  return await getResult(submission.token);
};

/**
 * Batch evaluate code against multiple test cases
 * Uses Judge0 batch submission API for parallel execution when possible
 */
const batchEvaluate = async (language, sourceCode, testCases, difficulty = 'Easy') => {
  const limits = EXECUTION_LIMITS[difficulty] || EXECUTION_LIMITS.default;
  const languageId = judge0Config.getLanguageId(language);

  if (!languageId) {
    throw Object.assign(new Error(`Unsupported language: ${language}`), { statusCode: 400 });
  }

  // Try batch submission first (faster)
  try {
    return await batchSubmitParallel(languageId, sourceCode, testCases, limits);
  } catch (batchError) {
    logger.warn('Batch submission failed, falling back to sequential:', batchError.message);
  }

  // Fallback: sequential execution
  return await batchSubmitSequential(language, sourceCode, testCases, limits);
};

/**
 * Parallel batch submission via Judge0 batch API
 */
async function batchSubmitParallel(languageId, sourceCode, testCases, limits) {
  const submissions = testCases.map((tc) => ({
    language_id: languageId,
    source_code: Buffer.from(sourceCode).toString('base64'),
    stdin: Buffer.from(tc.input || '').toString('base64'),
    expected_output: Buffer.from(tc.expectedOutput || '').toString('base64'),
    cpu_time_limit: limits.cpu_time_limit,
    memory_limit: limits.memory_limit,
  }));

  const response = await axios.post(
    `${judge0Config.baseUrl}/submissions/batch?base64_encoded=true`,
    { submissions },
    { headers: judge0Config.getHeaders(), timeout: 15000 }
  );

  const tokens = response.data.map((s) => s.token);

  // Poll all tokens
  await sleep(2000); // Initial wait

  const results = [];
  for (let i = 0; i < tokens.length; i++) {
    try {
      const result = await getResult(tokens[i]);
      const actualOutput = (result.stdout || '').trim();
      const expectedOutput = (testCases[i].expectedOutput || '').trim();
      const passed = actualOutput === expectedOutput && result.result === 'accepted';

      results.push({
        testCaseId: testCases[i].id,
        passed: result.statusId === 3 ? actualOutput === expectedOutput : false,
        isHidden: testCases[i].isHidden || false,
        actualOutput,
        expectedOutput,
        runtime: result.runtime,
        runtimeMs: result.runtimeMs,
        memory: result.memory,
        memoryKb: result.memoryKb,
        result: passed ? 'accepted' : result.result,
        error: result.stderr || result.compileOutput || result.message || null,
      });
    } catch (error) {
      results.push({
        testCaseId: testCases[i].id,
        passed: false,
        isHidden: testCases[i].isHidden || false,
        error: error.message,
        result: 'runtime_error',
      });
    }
  }

  return results;
}

/**
 * Sequential fallback for batch evaluation
 */
async function batchSubmitSequential(language, sourceCode, testCases, limits) {
  const results = [];

  for (const tc of testCases) {
    try {
      const result = await runCode(language, sourceCode, tc.input, limits);
      const actualOutput = (result.stdout || '').trim();
      const expectedOutput = (tc.expectedOutput || '').trim();
      const passed = actualOutput === expectedOutput;

      results.push({
        testCaseId: tc.id,
        passed,
        isHidden: tc.isHidden || false,
        actualOutput,
        expectedOutput,
        runtime: result.runtime,
        runtimeMs: result.runtimeMs,
        memory: result.memory,
        memoryKb: result.memoryKb,
        result: passed ? 'accepted' : result.result,
        error: result.stderr || result.compileOutput || result.message || null,
      });
    } catch (error) {
      results.push({
        testCaseId: tc.id,
        passed: false,
        isHidden: tc.isHidden || false,
        error: error.message,
        result: 'runtime_error',
      });
    }
  }

  return results;
}

/**
 * Get available languages from Judge0
 */
const getLanguages = async () => {
  try {
    const response = await axios.get(`${judge0Config.baseUrl}/languages`, {
      headers: judge0Config.getHeaders(),
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch Judge0 languages:', error.message);
    // Return supported languages from config as fallback
    return Object.entries(judge0Config.languages).map(([name, id]) => ({ id, name }));
  }
};

/**
 * Get Judge0 system info
 */
const getSystemInfo = async () => {
  try {
    const [aboutResp, statsResp] = await Promise.all([
      axios.get(`${judge0Config.baseUrl}/about`, { headers: judge0Config.getHeaders(), timeout: 5000 }),
      axios.get(`${judge0Config.baseUrl}/statuses`, { headers: judge0Config.getHeaders(), timeout: 5000 }),
    ]);
    return { about: aboutResp.data, statuses: statsResp.data };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  submitCode,
  getResult,
  runCode,
  batchEvaluate,
  getLanguages,
  getSystemInfo,
  EXECUTION_LIMITS,
};
