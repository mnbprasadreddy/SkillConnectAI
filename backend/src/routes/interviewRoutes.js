// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Interview Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/interviewController');
const { verifyToken } = require('../middleware/authMiddleware');
const { createInterviewValidator, endInterviewValidator, interviewIdValidator } = require('../validators/interviewValidator');
const { handleValidationErrors } = require('../utils/helpers');

router.post('/', verifyToken, createInterviewValidator, handleValidationErrors, ctrl.createSession);
router.put('/:id/end', verifyToken, endInterviewValidator, handleValidationErrors, ctrl.endSession);
router.get('/', verifyToken, ctrl.getMyInterviews);
router.get('/:id', verifyToken, interviewIdValidator, handleValidationErrors, ctrl.getInterviewById);
router.post('/:id/analytics', verifyToken, ctrl.saveAnalytics);
router.post('/questions', verifyToken, ctrl.getQuestions);

module.exports = router;
