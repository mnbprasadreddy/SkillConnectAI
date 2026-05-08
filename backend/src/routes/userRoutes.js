// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — User Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { syncUserValidator, updateProfileValidator } = require('../validators/userValidator');
const { handleValidationErrors } = require('../utils/helpers');

router.post('/sync', verifyToken, syncUserValidator, handleValidationErrors, ctrl.syncUser);
router.get('/profile', verifyToken, ctrl.getProfile);
router.get('/:uid', verifyToken, ctrl.getUserByUid);
router.put('/profile', verifyToken, updateProfileValidator, handleValidationErrors, ctrl.updateProfile);

module.exports = router;
