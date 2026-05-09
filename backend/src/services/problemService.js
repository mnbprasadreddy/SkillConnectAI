// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Problem Service
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create a new problem
 */
const createProblem = async (data) => {
  return await prisma.problem.create({
    data: {
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      topic: data.topic,
      constraints: data.constraints || null,
      examples: data.examples || null,
      starterCode: data.starterCode || null,
    },
  });
};

/**
 * Get all problems with pagination, search, and filters
 */
const getAllProblems = async ({ page, limit, offset, difficulty, topic, search, userId }) => {
  const where = {};

  if (difficulty) where.difficulty = difficulty;
  if (topic) where.topic = topic;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { topic: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [problems, totalCount] = await Promise.all([
    prisma.problem.findMany({
      where,
      select: {
        id: true,
        title: true,
        difficulty: true,
        topic: true,
        createdAt: true,
        _count: {
          select: {
            submissions: true,
            testCases: true,
          },
        },
      },
      orderBy: { id: 'asc' },
      skip: offset,
      take: limit,
    }),
    prisma.problem.count({ where }),
  ]);

  console.log(`[Service] Raw DB problems length:`, problems.length, `Total Count:`, totalCount);

  // If user is authenticated, check which problems they've solved
  let solvedIds = new Set();
  if (userId) {
    try {
      console.log(`[Service] Fetching solved problems for userId: ${userId}`);
      const solved = await prisma.submission.findMany({
        where: { userId, result: 'accepted' },
        select: { problemId: true },
        distinct: ['problemId'],
      });
      solvedIds = new Set(solved.map(s => s.problemId));
      console.log(`[Service] Solved problems count:`, solvedIds.size);
    } catch (e) {
      console.error(`[Service] Error fetching solved problems:`, e.message);
    }
  }

  const enhancedProblems = problems.map(p => ({
    ...p,
    isSolved: solvedIds.has(p.id),
  }));

  console.log(`[Service] Returning ${enhancedProblems.length} enhanced problems.`);

  return { problems: enhancedProblems, totalCount };
};

/**
 * Get a single problem by ID with public test cases
 */
const getProblemById = async (id, userId) => {
  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      testCases: {
        where: { isHidden: false },
        select: {
          id: true,
          input: true,
          expectedOutput: true,
        },
      },
    },
  });

  let isSolved = false;
  let savedCodes = {};

  if (userId && problem) {
    const submissions = await prisma.submission.findMany({
      where: { userId, problemId: id, result: 'accepted' },
      orderBy: { createdAt: 'desc' },
      distinct: ['language'],
      select: { 
        language: true, 
        sourceCode: true,
        runtime: true,
        memory: true,
        createdAt: true
      }
    });

    if (submissions.length > 0) {
      isSolved = true;
      submissions.forEach(sub => {
        if (!savedCodes[sub.language]) {
          savedCodes[sub.language] = {
            sourceCode: sub.sourceCode,
            runtime: sub.runtime,
            memory: sub.memory,
            submittedAt: sub.createdAt
          };
        }
      });
    }
  }

  return problem ? { ...problem, isSolved, savedCodes } : null;
};

/**
 * Update a problem
 */
const updateProblem = async (id, data) => {
  const allowedFields = ['title', 'description', 'difficulty', 'topic', 'constraints', 'examples', 'starterCode'];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  return await prisma.problem.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Delete a problem (cascades to test cases and submissions)
 */
const deleteProblem = async (id) => {
  return await prisma.problem.delete({
    where: { id },
  });
};

/**
 * Get distinct topics for filter dropdowns
 */
const getDistinctTopics = async () => {
  const result = await prisma.problem.findMany({
    select: { topic: true },
    distinct: ['topic'],
    orderBy: { topic: 'asc' },
  });
  return result.map((r) => r.topic);
};

/**
 * Get all test cases for a problem (including hidden — for evaluation engine)
 */
const getAllTestCases = async (problemId) => {
  return await prisma.testCase.findMany({
    where: { problemId },
    orderBy: { id: 'asc' },
  });
};

/**
 * Create test case(s) for a problem
 */
const createTestCases = async (problemId, testCases) => {
  const data = testCases.map((tc) => ({
    problemId,
    input: tc.input,
    expectedOutput: tc.expectedOutput || tc.expected_output,
    isHidden: tc.isHidden || tc.is_hidden || false,
  }));

  return await prisma.testCase.createMany({
    data,
  });
};

module.exports = {
  createProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
  getDistinctTopics,
  getAllTestCases,
  createTestCases,
};
