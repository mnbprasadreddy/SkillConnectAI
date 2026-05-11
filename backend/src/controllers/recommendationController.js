// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Recommendation Controller (v3)
// All handlers wrapped in try/catch — never crashes frontend.
// ═══════════════════════════════════════════════════════════════

const recommendationService = require('../services/recommendationService');
const { asyncHandler } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const getRecommendations = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const recs = await recommendationService.getRecommendations(req.user.id);
  return response.success(res, recs);
});

const generateRecommendations = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  try {
    const recs = await recommendationService.generateRecommendations(req.user.id);
    return response.success(res, recs, 'Recommendations generated');
  } catch (err) {
    console.error('[RecCtrl] Generation failed:', err.message);
    return response.success(res, [], 'Recommendations generation encountered an issue. Try again later.');
  }
});

const getWeakTopics = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const result = await recommendationService.getWeakTopics(req.user.id);
  return response.success(res, result);
});

const getAnalytics = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const result = await recommendationService.getRecommendationAnalytics(req.user.id);
  return response.success(res, result);
});

module.exports = { getRecommendations, generateRecommendations, getWeakTopics, getAnalytics };
