// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Problem Validators
// ═══════════════════════════════════════════════════════════════

const { body, param, query } = require('express-validator');

const createProblemValidator = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .isString(),
  body('difficulty')
    .notEmpty().withMessage('Difficulty is required')
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be: Easy, Medium, or Hard'),
  body('topic')
    .notEmpty().withMessage('Topic is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body('constraints')
    .optional()
    .isString(),
  body('examples')
    .optional()
    .isString(),
  body('starterCode')
    .optional()
    .isString(),
];

const updateProblemValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Problem ID must be a positive integer'),
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 255 }),
  body('description')
    .optional()
    .isString(),
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard']),
  body('topic')
    .optional()
    .isString()
    .trim(),
];

const problemIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Problem ID must be a positive integer'),
];

module.exports = { createProblemValidator, updateProblemValidator, problemIdValidator };
