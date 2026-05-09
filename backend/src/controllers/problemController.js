// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Problem Controller
// ═══════════════════════════════════════════════════════════════

const problemService = require('../services/problemService');
const { asyncHandler, parsePagination } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const createProblem = asyncHandler(async (req, res) => {
  const problem = await problemService.createProblem(req.body);
  return response.created(res, problem, 'Problem created');
});

const getAllProblems = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { difficulty, topic, search } = req.query;
  const userId = req.user?.id;
  
  console.log(`[Controller] getAllProblems called with params:`, { page, limit, difficulty, topic, search });
  
  const { problems, totalCount } = await problemService.getAllProblems({ page, limit, offset, difficulty, topic, search, userId });
  const topics = await problemService.getDistinctTopics();
  
  console.log(`[Controller] problems array length:`, problems?.length);
  
  return response.paginated(res, { data: problems, page, limit, totalCount, extras: { topics } });
});

const getProblemById = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const problem = await problemService.getProblemById(parseInt(req.params.id), userId);
  if (!problem) return response.notFound(res, 'Problem');
  return response.success(res, problem);
});

const updateProblem = asyncHandler(async (req, res) => {
  const problem = await problemService.updateProblem(parseInt(req.params.id), req.body);
  return response.success(res, problem, 'Problem updated');
});

const deleteProblem = asyncHandler(async (req, res) => {
  await problemService.deleteProblem(parseInt(req.params.id));
  return response.success(res, null, 'Problem deleted');
});

const createTestCases = asyncHandler(async (req, res) => {
  const problemId = parseInt(req.params.id);
  const testCases = Array.isArray(req.body) ? req.body : [req.body];
  const result = await problemService.createTestCases(problemId, testCases);
  return response.created(res, result, `${result.count} test case(s) created`);
});

module.exports = { createProblem, getAllProblems, getProblemById, updateProblem, deleteProblem, createTestCases };
