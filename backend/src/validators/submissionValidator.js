// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Submission Validators
// ═══════════════════════════════════════════════════════════════

const { body, param } = require('express-validator');

const runCodeValidator = [
  body('language')
    .notEmpty().withMessage('Language is required')
    .isString()
    .trim(),
  body('sourceCode')
    .notEmpty().withMessage('Source code is required')
    .isString(),
  body('input')
    .optional()
    .isString(),
];

const submitCodeValidator = [
  body('problemId')
    .notEmpty().withMessage('Problem ID is required')
    .isInt({ min: 1 }).withMessage('Problem ID must be a positive integer'),
  body('language')
    .notEmpty().withMessage('Language is required')
    .isString()
    .trim(),
  body('sourceCode')
    .notEmpty().withMessage('Source code is required')
    .isString(),
];

module.exports = { runCodeValidator, submitCodeValidator };
