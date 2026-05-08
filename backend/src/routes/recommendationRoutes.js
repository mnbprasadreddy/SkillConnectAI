// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Recommendation Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recommendationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, ctrl.getRecommendations);
router.post('/generate', verifyToken, ctrl.generateRecommendations);

module.exports = router;
