// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Recommendation Controller
// ═══════════════════════════════════════════════════════════════

const recommendationService = require('../services/recommendationService');
const { asyncHandler } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const getRecommendations = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const recs = await recommendationService.getRecommendations(req.user.id);
  // Parse JSON content for client convenience
  const parsed = recs.map((r) => ({
    ...r,
    content: JSON.parse(r.content),
  }));
  return response.success(res, parsed);
});

const generateRecommendations = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const recs = await recommendationService.generateRecommendations(req.user.id);
  return response.success(res, recs, 'Recommendations generated');
});

module.exports = { getRecommendations, generateRecommendations };
