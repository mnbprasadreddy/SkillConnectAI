// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Report Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/mine', verifyToken, ctrl.getMyReports);
router.get('/:interviewId', verifyToken, ctrl.getReport);
router.post('/generate/:interviewId', verifyToken, ctrl.generateReport);

module.exports = router;
