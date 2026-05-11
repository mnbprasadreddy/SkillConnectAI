// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Admin Seed (Idempotent)
// Creates the default super_admin on first startup.
// NEVER crashes the server — all errors are caught and logged.
// ═══════════════════════════════════════════════════════════════

const firebaseAdmin = require('../config/firebase');
const prisma = require('../config/database');
const logger = require('./logger');

const seedSuperAdmin = async () => {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn('[AdminSeed] DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD not set in .env — skipping admin seed.');
    return;
  }

  try {
    // 1. Ensure the Firebase Auth account exists
    let firebaseUid;
    try {
      const existingFirebaseUser = await firebaseAdmin.auth().getUserByEmail(email);
      firebaseUid = existingFirebaseUser.uid;
      // Ensure the password matches the .env value so admin can always login
      await firebaseAdmin.auth().updateUser(firebaseUid, { password });
      logger.info(`[AdminSeed] Firebase account synced for ${email} (UID: ${firebaseUid})`);

    } catch (fbErr) {
      if (fbErr.code === 'auth/user-not-found') {
        // Create the Firebase account
        const newFirebaseUser = await firebaseAdmin.auth().createUser({
          email,
          password,
          displayName: 'Super Admin',
        });
        firebaseUid = newFirebaseUser.uid;
        logger.info(`[AdminSeed] Created Firebase account for ${email} (UID: ${firebaseUid})`);
      } else {
        // Unexpected Firebase error — log and exit gracefully
        logger.error(`[AdminSeed] Firebase lookup failed: ${fbErr.message}`);
        return;
      }
    }

    // 2. Upsert the Prisma User with role = super_admin
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'super_admin' },
      create: {
        firebaseUid,
        email,
        name: 'Super Admin',
        role: 'super_admin',
      },
    });

    logger.info(`[AdminSeed] ✅ Super admin ready — DB ID: ${user.id} | Role: ${user.role}`);
  } catch (error) {
    // NEVER crash the server because of seed issues
    logger.error(`[AdminSeed] ❌ Seed failed (non-fatal): ${error.message}`);
  }
};

module.exports = seedSuperAdmin;
