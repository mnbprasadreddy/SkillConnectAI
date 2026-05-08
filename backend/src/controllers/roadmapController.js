// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Roadmap Controller
// ═══════════════════════════════════════════════════════════════

const roadmapService = require('../services/roadmapService');
const { asyncHandler } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const getRoadmap = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const roadmap = await roadmapService.getRoadmap(req.user.id);
  return response.success(res, {
    ...roadmap,
    completedTopics: JSON.parse(roadmap.completedTopics || '[]'),
  });
});

const updateProgress = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const { topic } = req.body;
  if (!topic) return response.badRequest(res, 'Topic is required');
  const roadmap = await roadmapService.updateProgress(req.user.id, topic);
  return response.success(res, roadmap, 'Progress updated');
});

const generateRoadmap = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const roadmap = await roadmapService.generateRoadmap(req.user.id);
  return response.success(res, roadmap, 'Roadmap generated');
});

module.exports = { getRoadmap, updateProgress, generateRoadmap };
