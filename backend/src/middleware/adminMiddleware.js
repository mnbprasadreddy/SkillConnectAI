// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Admin Authorization Middleware
// Must be used AFTER verifyToken (which populates req.user)
// ═══════════════════════════════════════════════════════════════

const response = require('../utils/apiResponse');

/**
 * Requires the authenticated user to have 'admin' or 'super_admin' role.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return response.unauthorized(res, 'Authentication required');
  }

  const role = req.user.role;
  if (role !== 'admin' && role !== 'super_admin') {
    console.warn(`[AdminMiddleware] Access denied for user ${req.user.id} (role: ${role})`);
    return response.error(res, 'Forbidden: Admin access required', 403);
  }

  next();
};

/**
 * Requires the authenticated user to have 'super_admin' role.
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return response.unauthorized(res, 'Authentication required');
  }

  if (req.user.role !== 'super_admin') {
    console.warn(`[AdminMiddleware] Super admin access denied for user ${req.user.id} (role: ${req.user.role})`);
    return response.error(res, 'Forbidden: Super admin access required', 403);
  }

  next();
};

module.exports = { requireAdmin, requireSuperAdmin };
