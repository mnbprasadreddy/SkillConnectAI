// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Roadmap Service
// Learning path management
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const logger = require('../utils/logger');

const getRoadmap = async (userId) => {
  let roadmap = await prisma.learningRoadmap.findFirst({ where: { userId } });
  if (!roadmap) {
    roadmap = await prisma.learningRoadmap.create({
      data: { userId, currentTopic: 'Arrays', progressPercentage: 0, completedTopics: '[]' },
    });
  }
  return roadmap;
};

const updateProgress = async (userId, completedTopic) => {
  const roadmap = await getRoadmap(userId);
  const completed = JSON.parse(roadmap.completedTopics || '[]');

  if (!completed.includes(completedTopic)) {
    completed.push(completedTopic);
  }

  const allTopics = [
    'Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues',
    'Trees', 'Graphs', 'Dynamic Programming', 'Sorting',
    'Searching', 'Hashing', 'Recursion', 'Bit Manipulation',
    'Greedy', 'Backtracking',
  ];

  const progress = Math.round((completed.length / allTopics.length) * 10000) / 100;
  const nextTopic = allTopics.find((t) => !completed.includes(t)) || null;

  return await prisma.learningRoadmap.update({
    where: { id: roadmap.id },
    data: {
      completedTopics: JSON.stringify(completed),
      progressPercentage: progress,
      currentTopic: nextTopic,
    },
  });
};

const generateRoadmap = async (userId) => {
  const submissions = await prisma.submission.findMany({
    where: { userId },
    include: { problem: { select: { topic: true } } },
  });

  const solvedTopics = [...new Set(
    submissions.filter((s) => s.result === 'accepted').map((s) => s.problem.topic)
  )];

  const roadmap = await getRoadmap(userId);
  const allTopics = [
    'Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues',
    'Trees', 'Graphs', 'Dynamic Programming', 'Sorting',
    'Searching', 'Hashing', 'Recursion',
  ];

  const progress = Math.round((solvedTopics.length / allTopics.length) * 10000) / 100;
  const nextTopic = allTopics.find((t) => !solvedTopics.includes(t)) || null;

  return await prisma.learningRoadmap.update({
    where: { id: roadmap.id },
    data: {
      completedTopics: JSON.stringify(solvedTopics),
      progressPercentage: progress,
      currentTopic: nextTopic,
    },
  });
};

module.exports = { getRoadmap, updateProgress, generateRoadmap };
