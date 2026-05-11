// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Admin Test Case Service (Isolated)
// Individual test case CRUD with transaction safety.
// NEVER bulk-replaces test cases — preserves IDs.
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');

/**
 * Get all test cases for a problem (admin view — includes archived)
 */
const getTestCasesForProblem = async (problemId) => {
  return await prisma.testCase.findMany({
    where: { problemId },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      input: true,
      expectedOutput: true,
      isHidden: true,
      isArchived: true,
      createdAt: true,
    },
  });
};

/**
 * Add a single test case to a problem (transaction-safe)
 */
const addTestCase = async (problemId, data) => {
  return await prisma.$transaction(async (tx) => {
    // Verify problem exists
    const problem = await tx.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
      throw Object.assign(new Error('Problem not found'), { statusCode: 404 });
    }

    return await tx.testCase.create({
      data: {
        problemId,
        input: data.input,
        expectedOutput: data.expectedOutput,
        isHidden: data.isHidden || false,
      },
    });
  });
};

/**
 * Update a single test case (transaction-safe, preserves ID)
 */
const updateTestCase = async (id, data) => {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.testCase.findUnique({ where: { id } });
    if (!existing) {
      throw Object.assign(new Error('Test case not found'), { statusCode: 404 });
    }

    const updateData = {};
    if (data.input !== undefined) updateData.input = data.input;
    if (data.expectedOutput !== undefined) updateData.expectedOutput = data.expectedOutput;
    if (data.isHidden !== undefined) updateData.isHidden = data.isHidden;

    return await tx.testCase.update({
      where: { id },
      data: updateData,
    });
  });
};

/**
 * Archive a test case (soft delete — preserves historical verdicts)
 */
const archiveTestCase = async (id) => {
  return await prisma.testCase.update({
    where: { id },
    data: { isArchived: true },
    select: { id: true, isArchived: true, problemId: true },
  });
};

/**
 * Unarchive a test case (restore to active)
 */
const unarchiveTestCase = async (id) => {
  return await prisma.testCase.update({
    where: { id },
    data: { isArchived: false },
    select: { id: true, isArchived: true, problemId: true },
  });
};

module.exports = {
  getTestCasesForProblem,
  addTestCase,
  updateTestCase,
  archiveTestCase,
  unarchiveTestCase,
};
