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

module.exports = {
  uploadBuffer,
  deleteFile,
};
