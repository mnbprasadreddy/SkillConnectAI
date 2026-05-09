// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Interview Validators
// ═══════════════════════════════════════════════════════════════

const { body, param } = require('express-validator');

const createInterviewValidator = [
  body('interviewType')
    .notEmpty().withMessage('Interview type is required')
    .isIn(['behavioral', 'technical', 'system_design', 'coding', 'hr'])
    .withMessage('Interview type must be: behavioral, technical, system_design, coding, or hr'),
  body('difficulty')
    .notEmpty().withMessage('Difficulty is required')
    .isIn(['Easy', 'Medium', 'Hard', 'Beginner', 'Intermediate', 'Advanced', 'beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be valid'),
  body('role')
    .optional()
    .isString().withMessage('Role must be a string'),
];

const endInterviewValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Interview ID must be a positive integer'),
  body('duration')
    .optional()
    .isInt({ min: 0 }),
  body('score')
    .optional()
    .isFloat({ min: 0, max: 100 }),
  body('confidenceScore')
    .optional()
    .isFloat({ min: 0, max: 100 }),
  body('communicationScore')
    .optional()
    .isFloat({ min: 0, max: 100 }),
  body('technicalScore')
    .optional()
    .isFloat({ min: 0, max: 100 }),
  body('codingScore')
    .optional()
    .isFloat({ min: 0, max: 100 }),
  body('recordingUrl')
    .optional()
    .isURL(),
  body('transcript')
    .optional()
    .isString(),
];

const interviewIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('Interview ID must be a positive integer'),
];

module.exports = { createInterviewValidator, endInterviewValidator, interviewIdValidator };
