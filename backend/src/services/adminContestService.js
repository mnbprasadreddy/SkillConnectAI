// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Admin Contest Service (Isolated)
// Contest CRUD with transactional safety.
// NEVER deletes contests, submissions, rankings, or leaderboard.
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const { CONTEST_STATUS } = require('../utils/constants');

/**
 * Get all contests for admin view (including archived)
 */
const getAllContestsAdmin = async ({ page, limit, search, archived }) => {
  const where = {};

  if (archived === 'true') where.isArchived = true;
  else if (archived === 'false') where.isArchived = false;

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  const skip = (page - 1) * limit;

  const [contests, totalCount] = await Promise.all([
    prisma.contest.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        _count: { select: { submissions: true, problems: true } },
      },
      skip,
      take: limit,
    }),
    prisma.contest.count({ where }),
  ]);

  return { contests, totalCount };
};

/**
 * Get a contest with full details for editing
 */
const getContestForEdit = async (id) => {
  return await prisma.contest.findUnique({
    where: { id },
    include: {
      problems: {
        include: {
          problem: { select: { id: true, title: true, difficulty: true, topic: true } },
        },
        orderBy: { points: 'asc' },
      },
      _count: { select: { submissions: true } },
    },
  });
};

/**
 * Create a contest with problem mappings (transaction-safe)
 */
const createContestWithProblems = async (data) => {
  const { title, description, startTime, endTime, difficulty, problemIds } = data;

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    throw Object.assign(new Error('End time must be after start time'), { statusCode: 400 });
  }

  // Determine initial status
  const now = new Date();
  let status = CONTEST_STATUS.UPCOMING;
  if (now >= start && now < end) status = CONTEST_STATUS.ACTIVE;
  if (now >= end) status = CONTEST_STATUS.COMPLETED;

  return await prisma.$transaction(async (tx) => {
    const contest = await tx.contest.create({
      data: {
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        difficulty,
        status,
      },
    });

    // Create problem mappings if provided
    if (problemIds && problemIds.length > 0) {
      const mappings = problemIds.map((pid, i) => ({
        contestId: contest.id,
        problemId: pid.id || pid,
        points: pid.points || 100,
      }));

      await tx.contestProblem.createMany({ data: mappings });
    }

    return await tx.contest.findUnique({
      where: { id: contest.id },
      include: {
        problems: {
          include: { problem: { select: { id: true, title: true, difficulty: true } } },
        },
      },
    });
  });
};

/**
 * Update contest details (NOT problem mappings)
 */
const updateContest = async (id, data) => {
  const allowedFields = ['title', 'description', 'difficulty'];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (data.startTime) updateData.startTime = new Date(data.startTime);
  if (data.endTime) updateData.endTime = new Date(data.endTime);

  if (updateData.startTime && updateData.endTime && updateData.endTime <= updateData.startTime) {
    throw Object.assign(new Error('End time must be after start time'), { statusCode: 400 });
  }

  return await prisma.contest.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Archive a contest (preserves all submissions, rankings, leaderboard)
 */
const archiveContest = async (id) => {
  return await prisma.contest.update({
    where: { id },
    data: { isArchived: true },
    select: { id: true, title: true, isArchived: true },
  });
};

/**
 * Unarchive a contest
 */
const unarchiveContest = async (id) => {
  return await prisma.contest.update({
    where: { id },
    data: { isArchived: false },
    select: { id: true, title: true, isArchived: true },
  });
};

/**
 * Add a problem to a contest (safe mapping only)
 */
const addProblemToContest = async (contestId, problemId, points = 100) => {
  // Verify both exist
  const [contest, problem] = await Promise.all([
    prisma.contest.findUnique({ where: { id: contestId } }),
    prisma.problem.findUnique({ where: { id: problemId } }),
  ]);

  if (!contest) throw Object.assign(new Error('Contest not found'), { statusCode: 404 });
  if (!problem) throw Object.assign(new Error('Problem not found'), { statusCode: 404 });

  return await prisma.contestProblem.create({
    data: { contestId, problemId, points },
    include: { problem: { select: { id: true, title: true, difficulty: true } } },
  });
};

/**
 * Remove a problem from a contest (detach mapping ONLY)
 * Does NOT delete the problem, submissions, or rankings
 */
const removeProblemFromContest = async (contestId, problemId) => {
  return await prisma.contestProblem.delete({
    where: {
      contestId_problemId: { contestId, problemId },
    },
  });
};

module.exports = {
  getAllContestsAdmin,
  getContestForEdit,
  createContestWithProblems,
  updateContest,
  archiveContest,
  unarchiveContest,
  addProblemToContest,
  removeProblemFromContest,
};
