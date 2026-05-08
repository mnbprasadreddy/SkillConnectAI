// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Analytics Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/dashboard', verifyToken, ctrl.getDashboard);
router.get('/coding', verifyToken, ctrl.getCodingStats);
router.get('/interview', verifyToken, ctrl.getInterviewStats);
router.get('/activity', verifyToken, ctrl.getRecentActivity);
router.get('/topics', verifyToken, ctrl.getTopicPerformance);

module.exports = router;
