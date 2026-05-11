// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Recommendation Routes (v3)
// Existing routes preserved. New endpoints appended.
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recommendationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, ctrl.getRecommendations);
router.post('/generate', verifyToken, ctrl.generateRecommendations);
router.get('/weak-topics', verifyToken, ctrl.getWeakTopics);
router.get('/analytics', verifyToken, ctrl.getAnalytics);

module.exports = router;
