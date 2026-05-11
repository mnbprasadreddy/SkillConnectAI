// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — AI Coach Routes
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/aiCoachController');
const { verifyToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/helpers');

// POST /api/ai-coach/chat — Send a message to the AI Coach
router.post('/chat', verifyToken, ctrl.chat);

// GET /api/ai-coach/context — Fetch user context snapshot
router.get('/context', verifyToken, ctrl.getContext);

// GET /api/ai-coach/health — Debug: verify Gemini key + service connectivity
router.get('/health', verifyToken, asyncHandler(async (req, res) => {
  const axios = require('axios');
  const key   = process.env.GEMINI_API_KEY;

  if (!key) {
    return res.status(200).json({ ok: false, reason: 'GEMINI_API_KEY not set in .env' });
  }

  try {
    const { data } = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      { contents: [{ role: 'user', parts: [{ text: 'Say HELLO in one word.' }] }] },
      { timeout: 10000 },
    );
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ ok: true, keyPresent: true, geminiReply: reply.slice(0, 100) });
  } catch (err) {
    return res.status(200).json({
      ok:        false,
      keyPresent: true,
      error:     err.message,
      status:    err.response?.status,
      detail:    JSON.stringify(err.response?.data)?.slice(0, 300),
    });
  }
}));

module.exports = router;
