// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Global Error Handler Middleware
// ═══════════════════════════════════════════════════════════════

const logger = require('../utils/logger');

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the full error
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'A record with that unique value already exists',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      error: 'Foreign key constraint failed — referenced record does not exist',
    });
  }

  // Validation errors (express-validator)
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: err.errors,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};

/**
 * 404 Not Found handler — place after all routes
 */
const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFoundHandler };
