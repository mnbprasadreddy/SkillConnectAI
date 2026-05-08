// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Helper Utilities
// ═══════════════════════════════════════════════════════════════

const { validationResult } = require('express-validator');

/**
 * Extract and throw validation errors from express-validator
 * Use as middleware after validator arrays
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[Validation] ❌ Validation failed for', req.method, req.originalUrl);
    console.error('[Validation] Errors:', JSON.stringify(errors.array()));
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};

/**
 * Parse pagination from query params with safe defaults
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Async handler wrapper to avoid try/catch in every controller
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Calculate percentage
 */
const calcPercentage = (part, total) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 10000) / 100;
};

/**
 * Sleep utility for polling
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate full storage URL from a path
 */
const getStorageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.STORAGE_BASE_URL || 'https://storage.googleapis.com/skillconnect-ai';
  return `${baseUrl}/${path.replace(/^\//, '')}`;
};

module.exports = {
  handleValidationErrors,
  parsePagination,
  asyncHandler,
  calcPercentage,
  sleep,
  getStorageUrl,
};
