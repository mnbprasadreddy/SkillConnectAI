// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Report Controller
// ═══════════════════════════════════════════════════════════════

const reportService = require('../services/reportService');
const { asyncHandler } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const generateReport = asyncHandler(async (req, res) => {
  const interviewId = parseInt(req.params.interviewId);
  const report = await reportService.generateReport(interviewId);
  return response.success(res, report, 'Report generated');
});

const getReport = asyncHandler(async (req, res) => {
  const interviewId = parseInt(req.params.interviewId);
  const report = await reportService.getReport(interviewId);
  if (!report) return response.notFound(res, 'Report');
  return response.success(res, report);
});

const getMyReports = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const reports = await reportService.getReportsByUser(req.user.id);
  return response.success(res, reports);
});

module.exports = { generateReport, getReport, getMyReports };
