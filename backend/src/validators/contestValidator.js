// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Contest Validators
// ═══════════════════════════════════════════════════════════════

const { body, param } = require('express-validator');

const createContestValidator = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 255 }),
  body('description')
    .optional()
    .isString(),
  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime')
    .notEmpty().withMessage('End time is required')
    .isISO8601().withMessage('End time must be a valid ISO 8601 date'),
  body('difficulty')
    .notEmpty().withMessage('Difficulty is required')
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be: Easy, Medium, or Hard'),
];

const contestIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Contest ID must be a positive integer'),
];

const contestSubmitValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Contest ID must be a positive integer'),
  body('score')
    .optional()
    .isFloat({ min: 0 }),
  body('solvedCount')
    .optional()
    .isInt({ min: 0 }),
];

module.exports = { createContestValidator, contestIdValidator, contestSubmitValidator };
