// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Submission Controller
// ═══════════════════════════════════════════════════════════════

const submissionService = require('../services/submissionService');
const { asyncHandler, parsePagination } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const runCode = asyncHandler(async (req, res) => {
  const { language, sourceCode, input } = req.body;
  const result = await submissionService.runCode(language, sourceCode, input);
  return response.success(res, result);
});

const submitCode = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res, 'Must be a registered user to submit');
  const { problemId, language, sourceCode } = req.body;
  const result = await submissionService.submitCode(req.user.id, problemId, language, sourceCode);
  return response.success(res, result, `Submission result: ${result.summary.overallResult}`);
});

const getMySubmissions = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const pagination = parsePagination(req.query);
  const { submissions, totalCount } = await submissionService.getSubmissionsByUser(req.user.id, pagination);
  return response.paginated(res, { data: submissions, ...pagination, totalCount });
});

const getSubmissionsByProblem = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const problemId = parseInt(req.params.problemId);
  const submissions = await submissionService.getSubmissionsByProblem(req.user.id, problemId);
  return response.success(res, submissions);
});

module.exports = { runCode, submitCode, getMySubmissions, getSubmissionsByProblem };
