// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Interview Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/interviewController');
const { verifyToken } = require('../middleware/authMiddleware');
const { createInterviewValidator, endInterviewValidator, interviewIdValidator } = require('../validators/interviewValidator');
const { handleValidationErrors } = require('../utils/helpers');

router.post('/', verifyToken, createInterviewValidator, handleValidationErrors, ctrl.createSession);
router.put('/:id/end', verifyToken, endInterviewValidator, handleValidationErrors, ctrl.endSession);
router.get('/', verifyToken, ctrl.getMyInterviews);

// ── STT diagnostic — must be before /:id to avoid param capture ──
router.get('/stt/status', verifyToken, async (req, res) => {
  const dgKey = process.env.DEEPGRAM_API_KEY;
  const hasKey = !!(dgKey && dgKey.trim().length > 10);
  const mode = hasKey ? 'deepgram' : 'web_speech_fallback';
  return res.status(200).json({
    success: true,
    data: {
      deepgramKeyPresent: hasKey,
      deepgramKeyHint:    hasKey ? `${dgKey.slice(0,4)}...${dgKey.slice(-4)}` : null,
      sttMode:            mode,
      tokenEndpoint:      '/api/interviews/token/deepgram',
      deepgramWssUrl:     'wss://api.deepgram.com/v1/listen',
      recommendation:     hasKey
        ? 'Deepgram is active. High-quality transcription available.'
        : 'Add DEEPGRAM_API_KEY to backend/.env and restart the server to enable Deepgram. Web Speech API fallback is currently active.',
    }
  });
});

router.get('/token/deepgram', verifyToken, ctrl.getDeepgramToken);
router.get('/:id', verifyToken, interviewIdValidator, handleValidationErrors, ctrl.getInterviewById);
router.post('/:id/analytics', verifyToken, ctrl.saveAnalytics);
router.post('/:id/analytics/final', verifyToken, ctrl.saveFinalAnalytics);
router.post('/questions', verifyToken, ctrl.getQuestions);
router.post('/transcribe', verifyToken, ctrl.transcribeAudio);
router.post('/:id/execute', verifyToken, ctrl.executeCode);
router.post('/:id/hint', verifyToken, ctrl.getHint);

module.exports = router;
