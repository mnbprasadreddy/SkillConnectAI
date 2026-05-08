// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — User Service
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Sync user from Firebase to local database (upsert)
 */
const syncUser = async (firebaseUid, email, name, profileImage = null) => {
  try {
    console.log(`[UserService] 🔍 Starting Sync Operation for: ${email} | UID: ${firebaseUid}`);
    
    // Check for email collision (email exists for DIFFERENT firebaseUid)
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUserByEmail && existingUserByEmail.firebaseUid !== firebaseUid) {
      console.warn(`[UserService] ⚠️ Email Collision detected for ${email}. Existing UID: ${existingUserByEmail.firebaseUid}, New UID: ${firebaseUid}`);
      console.log(`[UserService] Updating existing user ${existingUserByEmail.id} with new Firebase UID.`);
      
      const updated = await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: { firebaseUid }
      });
      console.log(`[UserService] ✅ Collision Resolved | Updated ID: ${updated.id}`);
      return updated;
    }

    console.log(`[UserService] Executing Prisma Upsert for UID: ${firebaseUid}`);
    console.log(`[UserService] Upsert Payload — Email: ${email}, Name: ${name}`);
    
    const user = await prisma.user.upsert({
      where: { firebaseUid },
      update: {
        email,
        name: name || 'Anonymous User',
        ...(profileImage && { profileImage }),
      },
      create: {
        firebaseUid,
        email,
        name: name || 'Anonymous User',
        profileImage,
      },
    });

    console.log(`[UserService] ✅ Prisma Sync Successful | ID: ${user.id} | Email: ${user.email}`);
    return user;
  } catch (error) {
    console.error(`[UserService] ❌ Prisma Sync FAILED for UID: ${firebaseUid}`);
    console.error(`[UserService] Error Name: ${error.name}`);
    console.error(`[UserService] Error Message: ${error.message}`);
    
    // Check for specific Prisma errors
    if (error.code === 'P2002') {
      console.error('[UserService] Unique constraint failed on fields:', error.meta?.target);
    }
    
    throw error; // Crucial: Re-throw to controller
  }
};

/**
 * Get user by Firebase UID
 */
const getUserByFirebaseUid = async (firebaseUid) => {
  return await prisma.user.findUnique({
    where: { firebaseUid },
  });
};

/**
 * Get user by internal ID
 */
const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

/**
 * Update user profile
 */
const updateProfile = async (userId, data) => {
  const allowedFields = ['name', 'profileImage', 'skillLevel'];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  return await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
};

/**
 * Update user streak based on daily activity
 */
const updateStreak = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // Check last submission date
  const lastSubmission = await prisma.submission.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastSubmission) return user;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(lastSubmission.createdAt);
  lastDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  let newStreak = user.streak;
  if (diffDays === 0) {
    // Already submitted today, streak unchanged
    newStreak = Math.max(1, user.streak);
  } else if (diffDays === 1) {
    // Consecutive day
    newStreak = user.streak + 1;
  } else {
    // Streak broken
    newStreak = 1;
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { streak: newStreak },
  });
};

/**
 * Recalculate user accuracy from all submissions
 */
const updateAccuracy = async (userId) => {
  const submissions = await prisma.submission.findMany({
    where: { userId },
  });

  const total = submissions.length;
  const accepted = submissions.filter((s) => s.result === 'accepted').length;
  const accuracy = total > 0 ? Math.round((accepted / total) * 10000) / 100 : 0;

  return await prisma.user.update({
    where: { id: userId },
    data: { accuracy },
  });
};

module.exports = {
  syncUser,
  getUserByFirebaseUid,
  getUserById,
  updateProfile,
  updateStreak,
  updateAccuracy,
};
