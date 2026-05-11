// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Roadmap Routes (v2)
// User-facing: topic listing, detail, progress
// Legacy GET /roadmap preserved for backward compat
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roadmapController');
const { verifyToken } = require('../middleware/authMiddleware');

// New AI roadmap endpoints
router.get('/topics', verifyToken, ctrl.getTopics);
router.get('/topics/:slug', verifyToken, ctrl.getTopicDetail);
router.post('/progress', verifyToken, ctrl.completeModule);

// Legacy endpoint (backward compat)
router.get('/', verifyToken, ctrl.getRoadmap);

module.exports = router;
