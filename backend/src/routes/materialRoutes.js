// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Materials Routes (User-Facing, READ-ONLY)
// Serves active (non-archived) materials to regular users.
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');
const response = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/helpers');

// ─── GET /api/materials — List active materials with filters ───
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const { topic, difficulty, search } = req.query;

  const where = { isArchived: false };
  if (topic) where.topic = topic;
  if (difficulty) where.difficulty = difficulty;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const materials = await prisma.material.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      topic: true,
      difficulty: true,
      description: true,
      articleUrl: true,
      youtubeUrl: true,
      pdfUrl: true,
      tags: true,
      createdAt: true,
    },
  });

  return response.success(res, materials);
}));

// ─── GET /api/materials/topics — Distinct topics ───────────────
router.get('/topics', verifyToken, asyncHandler(async (req, res) => {
  const topics = await prisma.material.findMany({
    where: { isArchived: false },
    select: { topic: true },
    distinct: ['topic'],
    orderBy: { topic: 'asc' },
  });
  return response.success(res, topics.map(t => t.topic));
}));

module.exports = router;
