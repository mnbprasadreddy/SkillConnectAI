// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Roadmap Controller (v2)
// ═══════════════════════════════════════════════════════════════

const roadmapService = require('../services/roadmapService');
const { asyncHandler } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const getTopics = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const topics = await roadmapService.getAllTopics(req.user.id);
  return response.success(res, topics);
});

const getTopicDetail = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const { slug } = req.params;
  const topic = await roadmapService.getTopicBySlug(slug, req.user.id);
  if (!topic) return response.notFound(res, 'Roadmap topic');
  return response.success(res, topic);
});

const completeModule = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const { moduleId, score } = req.body;
  if (!moduleId) return response.badRequest(res, 'moduleId is required');
  const result = await roadmapService.completeModule(req.user.id, parseInt(moduleId), score || null);
  return response.success(res, result, 'Module completed');
});

// Legacy endpoint — backward compat
const getRoadmap = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const roadmap = await roadmapService.getLegacyRoadmap(req.user.id);
  return response.success(res, {
    ...roadmap,
    completedTopics: JSON.parse(roadmap.completedTopics || '[]'),
  });
});

module.exports = { getTopics, getTopicDetail, completeModule, getRoadmap };
