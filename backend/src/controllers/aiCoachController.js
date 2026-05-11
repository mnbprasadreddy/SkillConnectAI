// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — AI Coach Controller
// ═══════════════════════════════════════════════════════════════

const aiCoachService  = require('../services/aiCoachService');
const aiContextService = require('../services/aiContextService');
const { asyncHandler } = require('../utils/helpers');
const response         = require('../utils/apiResponse');

// ─── POST /api/ai-coach/chat ─────────────────────────────────────
const chat = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);

  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return response.badRequest(res, 'Message is required');
  }

  // Fetch lightweight user context for personalization
  const context = await aiContextService.getUserContext(req.user.id);

  // Call Gemini via AI Coach service
  const reply = await aiCoachService.chat(message.trim(), history || [], context);

  return response.success(res, { reply }, 'AI Coach response');
});

// ─── GET /api/ai-coach/context ───────────────────────────────────
const getContext = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);

  const context = await aiContextService.getUserContext(req.user.id);
  return response.success(res, context, 'User context snapshot');
});

module.exports = { chat, getContext };
