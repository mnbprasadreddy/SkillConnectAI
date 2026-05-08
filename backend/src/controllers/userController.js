// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — User Controller
// ═══════════════════════════════════════════════════════════════

const userService = require('../services/userService');
const { asyncHandler } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const syncUser = asyncHandler(async (req, res) => {
  console.log('[UserController] ─── User Sync Operation Start ───');
  try {
    console.log('[UserController] req.firebaseUser:', JSON.stringify(req.firebaseUser));
    console.log('[UserController] req.body:', JSON.stringify(req.body));
    
    const { uid, email, name } = req.firebaseUser;
    const { full_name, profile_image } = req.body;
    
    console.log(`[UserController] Extracted Data — UID: ${uid} | Email: ${email}`);
    console.log(`[UserController] Payload Data — Name: ${full_name} | Image: ${profile_image}`);

    if (!email) {
      console.error(`[UserController] ❌ Sync failed: No email found in Firebase token for UID: ${uid}`);
      return response.badRequest(res, 'Email is required for synchronization. Please update your Firebase profile.');
    }

    const resolvedName = full_name || name || 'Anonymous User';
    
    console.log(`[UserController] Resolved Name for DB: ${resolvedName}`);
    
    const user = await userService.syncUser(uid, email, resolvedName, profile_image);
    
    console.log(`[UserController] ✅ Sync Success — DB ID: ${user.id}`);
    console.log('[UserController] ─── User Sync Operation Complete ───');
    
    return response.success(res, user, 'User synced successfully');
  } catch (error) {
    console.error('[UserController] ❌ CRITICAL SYNC ERROR:', error.message);
    console.error('[UserController] Stack Trace:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      context: 'syncUser',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

const getProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return response.notFound(res, 'User profile');
  }
  return response.success(res, req.user);
});

const getUserByUid = asyncHandler(async (req, res) => {
  const user = await userService.getUserByFirebaseUid(req.params.uid);
  if (!user) return response.notFound(res, 'User');
  return response.success(res, user);
});

const updateProfile = asyncHandler(async (req, res) => {
  if (!req.user) return response.notFound(res, 'User profile');
  const updated = await userService.updateProfile(req.user.id, req.body);
  return response.success(res, updated, 'Profile updated');
});

module.exports = { syncUser, getProfile, getUserByUid, updateProfile };
