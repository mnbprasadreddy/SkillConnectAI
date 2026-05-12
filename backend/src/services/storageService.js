const admin = require('../config/firebase');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload a file buffer to Firebase Storage
 */
const uploadBuffer = async (buffer, folder, filename, contentType) => {
  try {
    // If Firebase is not properly configured or in mock mode
    if (process.env.MOCK_STORAGE === 'true' || !admin.apps.length) {
      const mockUrl = `${process.env.STORAGE_BASE_URL || 'https://storage.skillconnect.ai'}/${folder}/${filename}`;
      logger.info(`[MOCK STORAGE] Uploading to ${mockUrl}`);
      return mockUrl;
    }

    const bucket = admin.storage().bucket();
    const filePath = `${folder}/${uuidv4()}_${filename}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: { contentType },
      public: true,
    });

    // Generate a permanent public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    return publicUrl;
  } catch (error) {
    logger.error('Storage upload failed:', error.message);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 */
const deleteFile = async (fileUrl) => {
  try {
    if (process.env.MOCK_STORAGE === 'true' || !admin.apps.length) return true;

    const bucket = admin.storage().bucket();
    const filePath = fileUrl.split(`${bucket.name}/`)[1];
    if (filePath) {
      await bucket.file(filePath).delete();
    }
    return true;
  } catch (error) {
    logger.warn('Storage deletion failed:', error.message);
    return false;
  }
};

// ─── REPLAY STORAGE ABSTRACTION ──────────────────────────────

const fs = require('fs');
const path = require('path');
const REPLAY_UPLOAD_DIR = path.join(__dirname, '../../uploads/interviews');

// Ensure directory exists
if (!fs.existsSync(REPLAY_UPLOAD_DIR)) {
  fs.mkdirSync(REPLAY_UPLOAD_DIR, { recursive: true });
}

/**
 * Save replay buffer/file locally
 */
const saveReplay = async (buffer, filename) => {
  try {
    const uniqueName = `${uuidv4()}_${filename}`;
    const filePath = path.join(REPLAY_UPLOAD_DIR, uniqueName);
    fs.writeFileSync(filePath, buffer);
    return uniqueName;
  } catch (error) {
    logger.error('saveReplay failed:', error.message);
    throw error;
  }
};

/**
 * Delete a local replay file
 */
const deleteReplay = async (filename) => {
  try {
    const filePath = path.join(REPLAY_UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.warn('deleteReplay failed:', error.message);
    return false;
  }
};

/**
 * Get public URL for a replay
 */
const getReplayUrl = (req, filename) => {
  const host = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  return `${host}/uploads/interviews/${filename}`;
};

module.exports = {
  uploadBuffer,
  deleteFile,
  saveReplay,
  deleteReplay,
  getReplayUrl,
};
