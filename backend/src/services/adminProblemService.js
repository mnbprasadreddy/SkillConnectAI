// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Admin Problem Service (Isolated)
// Handles admin-only problem CRUD with transactional safety.
// Does NOT modify or overlap with user-side problemService.
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');

/**
 * Get all problems for admin view (including archived)
 */
const getAllProblemsAdmin = async ({ page, limit, search, difficulty, archived }) => {
  const where = {};

  if (archived === 'true') where.isArchived = true;
  else if (archived === 'false') where.isArchived = false;
  // If archived is undefined/null, show all

  if (difficulty) where.difficulty = difficulty;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { topic: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [problems, totalCount] = await Promise.all([
    prisma.problem.findMany({
      where,
      select: {
        id: true,
        title: true,
        difficulty: true,
        topic: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submissions: true,
            testCases: true,
          },
        },
      },
      orderBy: { id: 'desc' },
      skip,
      take: limit,
    }),
    prisma.problem.count({ where }),
  ]);

  return { problems, totalCount };
};

/**
 * Get a single problem with all details for editing (including hidden test cases)
 */
const getProblemForEdit = async (id) => {
  return await prisma.problem.findUnique({
    where: { id },
    include: {
      testCases: {
        orderBy: { id: 'asc' },
        select: {
          id: true,
          input: true,
          expectedOutput: true,
          isHidden: true,
        },
      },
    },
  });
};

/**
 * Create a problem with test cases atomically using $transaction.
 * Rolls back everything if any step fails.
 */
const createProblemWithTestCases = async (data) => {
  const { title, description, difficulty, topic, constraints, examples, starterCode, testCases } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Create the problem
    const problem = await tx.problem.create({
      data: {
        title,
        description,
        difficulty,
        topic,
        constraints: constraints || null,
        examples: examples || null,
        starterCode: starterCode || null,
      },
    });

    // 2. Create test cases if provided
    if (testCases && testCases.length > 0) {
      const testCaseData = testCases.map((tc) => ({
        problemId: problem.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden || false,
      }));

      await tx.testCase.createMany({ data: testCaseData });
    }

    // 3. Return the full problem with test cases
    return await tx.problem.findUnique({
      where: { id: problem.id },
      include: {
        testCases: true,
      },
    });
  });
};

/**
 * Update an existing problem (fields only — test cases managed separately)
 */
const updateProblem = async (id, data) => {
  const allowedFields = ['title', 'description', 'difficulty', 'topic', 'constraints', 'examples', 'starterCode'];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  // Handle test cases update within a transaction
  return await prisma.$transaction(async (tx) => {
    const problem = await tx.problem.update({
      where: { id },
      data: updateData,
    });

    // If new test cases are provided, replace them
    if (data.testCases && Array.isArray(data.testCases)) {
      // Delete old test cases
      await tx.testCase.deleteMany({ where: { problemId: id } });

      // Insert new ones
      if (data.testCases.length > 0) {
        const testCaseData = data.testCases.map((tc) => ({
          problemId: id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden || false,
        }));
        await tx.testCase.createMany({ data: testCaseData });
      }
    }

    return await tx.problem.findUnique({
      where: { id },
      include: { testCases: true },
    });
  });
};

/**
 * Archive a problem (soft delete — preserves all related data)
 */
const archiveProblem = async (id) => {
  return await prisma.problem.update({
    where: { id },
    data: { isArchived: true },
    select: { id: true, title: true, isArchived: true },
  });
};

/**
 * Unarchive a problem (restore to active)
 */
const unarchiveProblem = async (id) => {
  return await prisma.problem.update({
    where: { id },
    data: { isArchived: false },
    select: { id: true, title: true, isArchived: true },
  });
};

module.exports = {
  getAllProblemsAdmin,
  getProblemForEdit,
  createProblemWithTestCases,
  updateProblem,
  archiveProblem,
  unarchiveProblem,
};
