// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Firebase Admin SDK Configuration
// ═══════════════════════════════════════════════════════════════

const admin = require('firebase-admin');
require('dotenv').config();

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  console.log('[Firebase] Initializing Admin SDK...');
  console.log('[Firebase] Project ID:', projectId || '❌ MISSING');
  console.log('[Firebase] Client Email:', clientEmail || '❌ MISSING');
  console.log('[Firebase] Private Key:', privateKey ? `✅ Present (${privateKey.length} chars)` : '❌ MISSING');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Firebase Admin SDK initialization SKIPPED — missing credentials');
    console.error('  → Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY are set in .env');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✅ Firebase Admin SDK initialized successfully for project:', projectId);
    } catch (error) {
      console.error('❌ Firebase Admin initialization failed:', error.message);
      console.error('  → Check that FIREBASE_PRIVATE_KEY matches the service account for', clientEmail);
    }
  }
}

module.exports = admin;
