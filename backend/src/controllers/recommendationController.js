// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Recommendation Controller
// ═══════════════════════════════════════════════════════════════

const recommendationService = require('../services/recommendationService');
const { asyncHandler } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const getRecommendations = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const recs = await recommendationService.getRecommendations(req.user.id);
  // Content is already parsed in the service layer, no need to map/parse here.
  return response.success(res, recs);
});

const generateRecommendations = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const recs = await recommendationService.generateRecommendations(req.user.id);
  return response.success(res, recs, 'Recommendations generated');
});

module.exports = { getRecommendations, generateRecommendations };
