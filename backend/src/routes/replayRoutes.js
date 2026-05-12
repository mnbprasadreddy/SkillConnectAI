const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');
const replayService = require('../services/replayService');
const storageService = require('../services/storageService');
const response = require('../utils/apiResponse');

const router = express.Router();

// Configure multer for memory storage and validations
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/webm' || file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only WebM and MP4 are allowed.'));
    }
  },
});

/**
 * @route   GET /api/replays
 * @desc    Get all replays for the authenticated user
 * @access  Private
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const replays = await replayService.getUserReplays(req.user.id, req);
    response.success(res, 'Replays fetched successfully', replays);
  } catch (error) {
    response.error(res, error.message, 500);
  }
});

/**
 * @route   GET /api/replays/:id
 * @desc    Get a specific replay by its interview ID
 * @access  Private
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const replay = await replayService.getReplayByInterviewId(req.params.id, req);
    if (!replay) {
      return response.error(res, 'Replay not found', 404);
    }
    
    if (replay.userId !== req.user.id) {
      return response.error(res, 'Unauthorized to view this replay', 403);
    }
    
    response.success(res, 'Replay fetched successfully', replay);
  } catch (error) {
    response.error(res, error.message, 500);
  }
});

/**
 * @route   POST /api/replays/upload
 * @desc    Upload an interview replay video
 * @access  Private
 */
router.post('/upload', verifyToken, (req, res) => {
  // Use multer middleware safely within the route to catch multer errors
  upload.single('video')(req, res, async (err) => {
    if (err) {
      // Catch file size or mime type errors
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return response.error(res, 'File too large. Maximum size is 100MB.', 413);
      }
      return response.error(res, err.message, 400);
    }

    try {
      const { interviewId, duration } = req.body;
      const file = req.file;

      if (!file || !interviewId) {
        return response.error(res, 'Video file and interviewId are required.', 400);
      }

      // Check if replay already exists to prevent duplicates
      const existing = await replayService.getReplayByInterviewId(interviewId, req);
      if (existing) {
        return response.error(res, 'A replay for this interview already exists.', 409);
      }

      // Save to storage abstraction
      const originalName = file.originalname || 'replay.webm';
      const uniqueFilename = await storageService.saveReplay(file.buffer, originalName);

      // Save metadata to database
      const replay = await replayService.saveReplayMetadata(
        req.user.id,
        interviewId,
        uniqueFilename,
        duration,
        file.size
      );

      // Fetch full replay to return public URL
      const fullReplay = await replayService.getReplayByInterviewId(interviewId, req);

      response.success(res, 'Replay uploaded successfully', fullReplay, 201);
    } catch (error) {
      response.error(res, error.message, 500);
    }
  });
});

/**
 * @route   DELETE /api/replays/:id
 * @desc    Delete a replay
 * @access  Private
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await replayService.deleteReplay(req.params.id, req.user.id);
    response.success(res, 'Replay deleted successfully');
  } catch (error) {
    if (error.message === 'Replay not found') {
      return response.error(res, error.message, 404);
    }
    if (error.message === 'Unauthorized') {
      return response.error(res, error.message, 403);
    }
    response.error(res, 'Failed to delete replay', 500);
  }
});

module.exports = router;
