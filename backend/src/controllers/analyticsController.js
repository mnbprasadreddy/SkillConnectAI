// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Analytics Controller
// ═══════════════════════════════════════════════════════════════

const analyticsService = require('../services/analyticsService');
const { asyncHandler } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const getDashboard = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const data = await analyticsService.getDashboardOverview(req.user.id);
  return response.success(res, data);
});

const getCodingStats = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const data = await analyticsService.getCodingStats(req.user.id);
  return response.success(res, data);
});

const getInterviewStats = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const data = await analyticsService.getInterviewStats(req.user.id);
  return response.success(res, data);
});

const getRecentActivity = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const limit = parseInt(req.query.limit) || 20;
  const data = await analyticsService.getRecentActivity(req.user.id, limit);
  return response.success(res, data);
});

const getTopicPerformance = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const data = await analyticsService.getTopicPerformance(req.user.id);
  return response.success(res, data);
});

module.exports = { getDashboard, getCodingStats, getInterviewStats, getRecentActivity, getTopicPerformance };
