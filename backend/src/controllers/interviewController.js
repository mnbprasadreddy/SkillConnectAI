// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Interview Controller
// ═══════════════════════════════════════════════════════════════

const interviewService = require('../services/interviewService');
const { asyncHandler, parsePagination } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const createSession = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const { interviewType, difficulty } = req.body;
  const interview = await interviewService.createSession(req.user.id, interviewType, difficulty);
  return response.created(res, interview, 'Interview session started');
});

const endSession = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const interview = await interviewService.endSession(id, req.body);
  return response.success(res, interview, 'Interview session completed');
});

const getMyInterviews = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const pagination = parsePagination(req.query);
  const { interviews, totalCount } = await interviewService.getInterviewsByUser(req.user.id, pagination);
  return response.paginated(res, { data: interviews, ...pagination, totalCount });
});

const getInterviewById = asyncHandler(async (req, res) => {
  const interview = await interviewService.getInterviewById(parseInt(req.params.id));
  if (!interview) return response.notFound(res, 'Interview');
  return response.success(res, interview);
});

const saveAnalytics = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const analytics = await interviewService.saveAnalytics(id, req.body);
  return response.success(res, analytics, 'Analytics saved');
});

const getQuestions = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const { interviewType, difficulty, count } = req.body;
  const questions = await interviewService.generateQuestions(req.user.id, interviewType, difficulty, count);
  return response.success(res, questions);
});

module.exports = { createSession, endSession, getMyInterviews, getInterviewById, saveAnalytics, getQuestions };
