// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Standardized API Response Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Send a success response
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a created response (201)
 */
const created = (res, data = null, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

/**
 * Send a paginated response
 */
const paginated = (res, { data, page, limit, totalCount, extras = {} }) => {
  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json({
    success: true,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    ...extras,
  });
};

/**
 * Send an error response
 */
const error = (res, message = 'Something went wrong', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: message,
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a not found response
 */
const notFound = (res, resource = 'Resource') => {
  return error(res, `${resource} not found`, 404);
};

/**
 * Send a bad request response
 */
const badRequest = (res, message = 'Bad request', details = null) => {
  return error(res, message, 400, details);
};

/**
 * Send an unauthorized response
 */
const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

module.exports = { success, created, paginated, error, notFound, badRequest, unauthorized };
