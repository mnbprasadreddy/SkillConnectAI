// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Contest Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/contestController');
const { verifyToken } = require('../middleware/authMiddleware');
const { createContestValidator, contestIdValidator, contestSubmitValidator } = require('../validators/contestValidator');
const { handleValidationErrors } = require('../utils/helpers');

router.post('/', verifyToken, createContestValidator, handleValidationErrors, ctrl.createContest);
router.get('/', ctrl.getAllContests);
router.get('/:id', contestIdValidator, handleValidationErrors, ctrl.getContestById);
router.post('/:id/join', verifyToken, contestIdValidator, handleValidationErrors, ctrl.joinContest);
router.post('/:id/submit', verifyToken, contestSubmitValidator, handleValidationErrors, ctrl.submitSolution);
router.get('/:id/leaderboard', contestIdValidator, handleValidationErrors, ctrl.getLeaderboard);

module.exports = router;
