// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Contest Controller
// ═══════════════════════════════════════════════════════════════

const contestService = require('../services/contestService');
const { asyncHandler } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const createContest = asyncHandler(async (req, res) => {
  const contest = await contestService.createContest(req.body);
  return response.created(res, contest, 'Contest created');
});

const getAllContests = asyncHandler(async (req, res) => {
  const contests = await contestService.getAllContests();
  return response.success(res, contests);
});

const getContestById = asyncHandler(async (req, res) => {
  const contest = await contestService.getContestById(parseInt(req.params.id));
  if (!contest) return response.notFound(res, 'Contest');
  return response.success(res, contest);
});

const joinContest = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const result = await contestService.joinContest(req.user.id, parseInt(req.params.id));
  return response.success(res, result, 'Joined contest');
});

const submitSolution = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const result = await contestService.submitContestSolution(req.user.id, parseInt(req.params.id), req.body);
  return response.success(res, result, 'Solution submitted');
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await contestService.getLeaderboard(parseInt(req.params.id));
  return response.success(res, leaderboard);
});

module.exports = { createContest, getAllContests, getContestById, joinContest, submitSolution, getLeaderboard };
