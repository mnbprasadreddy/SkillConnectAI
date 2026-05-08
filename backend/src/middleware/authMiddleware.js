// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Firebase Auth Middleware
// Verifies Firebase ID tokens on protected routes
// ═══════════════════════════════════════════════════════════════

const admin = require('../config/firebase');
const prisma = require('../config/database');

/**
 * Verify Firebase token and attach user data to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided',
      });
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    console.log(`[AuthMiddleware] ✅ Token Verified | UID: ${decodedToken.uid} | Email: ${decodedToken.email}`);

    // Attach decoded Firebase user info
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || '',
    };
    // Try to find the database user
    console.log(`[AuthMiddleware] Looking up DB user for firebaseUid: ${decodedToken.uid}`);
    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });
    if (dbUser) {
      req.user = dbUser;
      console.log(`[AuthMiddleware] ✅ DB User Found: ${dbUser.id}`);
    } else {
      console.log(`[AuthMiddleware] ⚠️ No DB user found for UID: ${decodedToken.uid}`);
    }
    next();
  } catch (error) {
    console.error('[AuthMiddleware] ❌ Token verification FAILED:', error.code || error.message);
    console.error('[AuthMiddleware] Full error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired token',
    });
  }
};

/**
 * Optional auth — does not fail if no token, but attaches user if present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      req.firebaseUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || '',
      };

      const dbUser = await prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid },
      });

      if (dbUser) {
        req.user = dbUser;
      }
    }
  } catch (error) {
    // Silently continue — auth is optional
  }

  next();
};

module.exports = { verifyToken, optionalAuth };
