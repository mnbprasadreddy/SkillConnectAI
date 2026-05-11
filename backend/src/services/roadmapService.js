// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Roadmap Service (v2 — AI-Powered)
// DB-backed, sequential unlocking, adaptive insights.
// READ-ONLY from weak topic engine — never modifies it.
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════
// USER-FACING: Get all roadmap topics with progress
// ═══════════════════════════════════════════════════════════════

const getAllTopics = async (userId) => {
  try {
    const topics = await prisma.roadmapTopic.findMany({
      where: { isArchived: false },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true, orderIndex: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user progress for all modules
    const moduleIds = topics.flatMap(t => t.modules.map(m => m.id));
    const progress = moduleIds.length > 0 ? await prisma.userRoadmapProgress.findMany({
      where: { userId, moduleId: { in: moduleIds } },
    }) : [];

    const progressMap = {};
    for (const p of progress) progressMap[p.moduleId] = p;

    return topics.map(topic => {
      const completed = topic.modules.filter(m => progressMap[m.id]?.completed).length;
      return {
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        description: topic.description,
        totalModules: topic.totalModules,
        difficulty: topic.difficulty,
        roleTrack: topic.roleTrack,
        completedModules: completed,
        progressPercent: topic.totalModules > 0 ? Math.round((completed / topic.totalModules) * 100) : 0,
      };
    });
  } catch (err) {
    logger.error('[RoadmapService] getAllTopics failed:', err.message);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════
// USER-FACING: Get a specific topic with modules + progress
// ═══════════════════════════════════════════════════════════════

const getTopicBySlug = async (slug, userId) => {
  try {
    const topic = await prisma.roadmapTopic.findUnique({
      where: { slug },
      include: {
        modules: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!topic || topic.isArchived) return null;

    // Get user progress
    const moduleIds = topic.modules.map(m => m.id);
    const progress = moduleIds.length > 0 ? await prisma.userRoadmapProgress.findMany({
      where: { userId, moduleId: { in: moduleIds } },
    }) : [];

    const progressMap = {};
    for (const p of progress) progressMap[p.moduleId] = p;

    // Determine unlock state: module 0 always unlocked, others unlock sequentially
    const modules = topic.modules.map((mod, i) => {
      const userProg = progressMap[mod.id];
      const isFirstModule = i === 0;
      const prevCompleted = i > 0 ? !!progressMap[topic.modules[i - 1].id]?.completed : true;

      const isUnlocked = isFirstModule || prevCompleted || !!userProg?.unlockedAt;
      const isCompleted = !!userProg?.completed;

      return {
        id:               mod.id,
        title:            mod.title,
        description:      mod.description,
        difficulty:       mod.difficulty,
        orderIndex:       mod.orderIndex,
        estimatedHours:   mod.estimatedHours,
        concepts:         mod.concepts,
        milestones:       mod.milestones,
        checkpoints:      mod.checkpoints,
        // ─── Detailed AI-generated content ───
        theory:           mod.theory           || null,
        examples:         mod.examples         || [],
        codeSnippets:     mod.codeSnippets     || [],
        bestPractices:    mod.bestPractices     || [],
        commonMistakes:   mod.commonMistakes    || [],
        interviewTips:    mod.interviewTips     || [],
        miniExercises:    mod.miniExercises     || [],
        practiceProblems: mod.practiceProblems  || [],
        isLocked:         !isUnlocked,
        isCompleted,
        completedAt:      userProg?.completedAt || null,
        score:            userProg?.score       || null,
      };
    });

    const completedCount = modules.filter(m => m.isCompleted).length;

    return {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      description: topic.description,
      totalModules: topic.totalModules,
      difficulty: topic.difficulty,
      roleTrack: topic.roleTrack,
      modules,
      completedModules: completedCount,
      progressPercent: topic.totalModules > 0 ? Math.round((completedCount / topic.totalModules) * 100) : 0,
    };
  } catch (err) {
    logger.error('[RoadmapService] getTopicBySlug failed:', err.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════
// USER-FACING: Complete a module → auto-unlock next
// ═══════════════════════════════════════════════════════════════

const completeModule = async (userId, moduleId, score = null) => {
  try {
    // Upsert progress
    const progress = await prisma.userRoadmapProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: {
        completed: true,
        score,
        completedAt: new Date(),
      },
      create: {
        userId,
        moduleId,
        completed: true,
        score,
        unlockedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Find next module and auto-unlock
    const currentModule = await prisma.roadmapModule.findUnique({
      where: { id: moduleId },
    });

    if (currentModule) {
      const nextModule = await prisma.roadmapModule.findFirst({
        where: {
          topicId: currentModule.topicId,
          orderIndex: currentModule.orderIndex + 1,
        },
      });

      if (nextModule) {
        // Create unlock record for next module (if not exists)
        await prisma.userRoadmapProgress.upsert({
          where: { userId_moduleId: { userId, moduleId: nextModule.id } },
          update: {
            unlockedAt: new Date(),
          },
          create: {
            userId,
            moduleId: nextModule.id,
            completed: false,
            unlockedAt: new Date(),
          },
        });
      }
    }

    return progress;
  } catch (err) {
    logger.error('[RoadmapService] completeModule failed:', err.message);
    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════
// LEGACY: Keep old roadmap endpoint working for backward compat
// ═══════════════════════════════════════════════════════════════

const getLegacyRoadmap = async (userId) => {
  try {
    let roadmap = await prisma.learningRoadmap.findFirst({ where: { userId } });
    if (!roadmap) {
      roadmap = await prisma.learningRoadmap.create({
        data: { userId, currentTopic: 'Arrays', progressPercentage: 0, completedTopics: '[]' },
      });
    }
    return roadmap;
  } catch (err) {
    logger.error('[RoadmapService] getLegacyRoadmap failed:', err.message);
    return { currentTopic: 'Arrays', progressPercentage: 0, completedTopics: '[]' };
  }
};

module.exports = { getAllTopics, getTopicBySlug, completeModule, getLegacyRoadmap };
