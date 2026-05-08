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
const getAllProblems = async ({ page, limit, offset, difficulty, topic, search }) => {
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

  return { problems, totalCount };
};

/**
 * Get a single problem by ID with public test cases
 */
const getProblemById = async (id) => {
  return await prisma.problem.findUnique({
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
