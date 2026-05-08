// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Problem Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/problemController');
const { verifyToken } = require('../middleware/authMiddleware');
const { createProblemValidator, updateProblemValidator, problemIdValidator } = require('../validators/problemValidator');
const { handleValidationErrors } = require('../utils/helpers');

router.get('/', ctrl.getAllProblems);
router.get('/:id', problemIdValidator, handleValidationErrors, ctrl.getProblemById);
router.post('/', verifyToken, createProblemValidator, handleValidationErrors, ctrl.createProblem);
router.put('/:id', verifyToken, updateProblemValidator, handleValidationErrors, ctrl.updateProblem);
router.delete('/:id', verifyToken, problemIdValidator, handleValidationErrors, ctrl.deleteProblem);
router.post('/:id/testcases', verifyToken, ctrl.createTestCases);

module.exports = router;
