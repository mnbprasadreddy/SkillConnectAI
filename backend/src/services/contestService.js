// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Contest Service
// Contest lifecycle, scoring, leaderboard
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const { CONTEST_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Create a new contest
 */
const createContest = async (data) => {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  if (endTime <= startTime) {
    throw Object.assign(new Error('End time must be after start time'), { statusCode: 400 });
  }

  // Determine initial status
  const now = new Date();
  let status = CONTEST_STATUS.UPCOMING;
  if (now >= startTime && now < endTime) status = CONTEST_STATUS.ACTIVE;
  if (now >= endTime) status = CONTEST_STATUS.COMPLETED;

  return await prisma.contest.create({
    data: {
      title: data.title,
      description: data.description || null,
      startTime,
      endTime,
      difficulty: data.difficulty,
      status,
    },
  });
};

/**
 * Get all contests with auto-updated status
 */
const getAllContests = async () => {
  const contests = await prisma.contest.findMany({
    orderBy: { startTime: 'desc' },
    include: {
      _count: { select: { submissions: true } },
    },
  });

  // Auto-update status based on current time
  const now = new Date();
  const updatedContests = [];

  for (const contest of contests) {
    let newStatus = contest.status;
    if (now < contest.startTime) newStatus = CONTEST_STATUS.UPCOMING;
    else if (now >= contest.startTime && now < contest.endTime) newStatus = CONTEST_STATUS.ACTIVE;
    else newStatus = CONTEST_STATUS.COMPLETED;

    if (newStatus !== contest.status) {
      await prisma.contest.update({
        where: { id: contest.id },
        data: { status: newStatus },
      });
    }

    updatedContests.push({ ...contest, status: newStatus });
  }

  return updatedContests;
};

/**
 * Get contest by ID
 */
const getContestById = async (id) => {
  return await prisma.contest.findUnique({
    where: { id },
    include: {
      submissions: {
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
        orderBy: [{ score: 'desc' }, { completionTime: 'asc' }],
      },
    },
  });
};

/**
 * Join a contest (register)
 */
const joinContest = async (userId, contestId) => {
  // Check if contest exists and is active/upcoming
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    throw Object.assign(new Error('Contest not found'), { statusCode: 404 });
  }

  const now = new Date();
  if (now >= contest.endTime) {
    throw Object.assign(new Error('Contest has already ended'), { statusCode: 400 });
  }

  // Check if already joined
  const existing = await prisma.contestSubmission.findUnique({
    where: {
      contestId_userId: { contestId, userId },
    },
  });

  if (existing) {
    return existing; // Already joined
  }

  return await prisma.contestSubmission.create({
    data: {
      contestId,
      userId,
      score: 0,
      solvedCount: 0,
    },
  });
};

/**
 * Submit during a contest
 */
const submitContestSolution = async (userId, contestId, data) => {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    throw Object.assign(new Error('Contest not found'), { statusCode: 404 });
  }

  const now = new Date();
  if (now < contest.startTime || now >= contest.endTime) {
    throw Object.assign(new Error('Contest is not currently active'), { statusCode: 400 });
  }

  // Calculate completion time (seconds since contest start)
  const completionTime = Math.floor((now - contest.startTime) / 1000);

  return await prisma.contestSubmission.upsert({
    where: {
      contestId_userId: { contestId, userId },
    },
    update: {
      score: data.score || 0,
      solvedCount: data.solvedCount || 0,
      completionTime,
    },
    create: {
      contestId,
      userId,
      score: data.score || 0,
      solvedCount: data.solvedCount || 0,
      completionTime,
    },
  });
};

/**
 * Get leaderboard for a contest
 */
const getLeaderboard = async (contestId) => {
  const submissions = await prisma.contestSubmission.findMany({
    where: { contestId },
    include: {
      user: { select: { id: true, name: true, profileImage: true } },
    },
    orderBy: [{ score: 'desc' }, { completionTime: 'asc' }],
  });

  return submissions.map((sub, index) => ({
    rank: index + 1,
    userId: sub.user.id,
    name: sub.user.name,
    profileImage: sub.user.profileImage,
    score: sub.score,
    solvedCount: sub.solvedCount,
    completionTime: sub.completionTime,
  }));
};

module.exports = {
  createContest,
  getAllContests,
  getContestById,
  joinContest,
  submitContestSolution,
  getLeaderboard,
};
