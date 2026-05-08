// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Roadmap Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roadmapController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, ctrl.getRoadmap);
router.put('/progress', verifyToken, ctrl.updateProgress);
router.post('/generate', verifyToken, ctrl.generateRoadmap);

module.exports = router;
