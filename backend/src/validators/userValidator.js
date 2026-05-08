// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — User Validators
// ═══════════════════════════════════════════════════════════════

const { body, param } = require('express-validator');

const syncUserValidator = [
  body('full_name')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('profile_image')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Profile image must be a valid string'),
];

const updateProfileValidator = [
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('profileImage')
    .optional()
    .isURL()
    .withMessage('Profile image must be a valid URL'),
  body('skillLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Skill level must be: beginner, intermediate, advanced, or expert'),
];

module.exports = { syncUserValidator, updateProfileValidator };
