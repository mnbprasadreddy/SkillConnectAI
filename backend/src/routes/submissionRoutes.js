// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Submission Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/submissionController');
const { verifyToken } = require('../middleware/authMiddleware');
const { runCodeValidator, submitCodeValidator } = require('../validators/submissionValidator');
const { handleValidationErrors } = require('../utils/helpers');
const { submissionLimiter } = require('../middleware/rateLimiter');

router.post('/run', verifyToken, submissionLimiter, runCodeValidator, handleValidationErrors, ctrl.runCode);
router.post('/submit', verifyToken, submissionLimiter, submitCodeValidator, handleValidationErrors, ctrl.submitCode);
router.get('/mine', verifyToken, ctrl.getMySubmissions);
router.get('/problem/:problemId', verifyToken, ctrl.getSubmissionsByProblem);

module.exports = router;
