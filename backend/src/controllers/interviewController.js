// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Interview Controller
// ═══════════════════════════════════════════════════════════════

const interviewService = require('../services/interviewService');
const { asyncHandler, parsePagination } = require('../utils/helpers');
const response = require('../utils/apiResponse');

const createSession = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const { interviewType, difficulty, role } = req.body;
  console.log(`[InterviewSessionCreate] User: ${req.user.id}, Type: ${interviewType}, Difficulty: ${difficulty}, Role: ${role || 'none'}`);
  try {
    const interview = await interviewService.createSession(req.user.id, interviewType, difficulty, role);
    console.log(`[InterviewSessionCreate] Success: Session ${interview.id}`);
    return response.created(res, interview, 'Interview session started');
  } catch (err) {
    console.error(`[InterviewSessionCreate] Failed:`, err.message);
    throw err;
  }
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

// Called ONCE at end of session — saves final biometric snapshot
const saveFinalAnalytics = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const id = parseInt(req.params.id);
  const analytics = await interviewService.saveFinalAnalytics(id, req.body);
  return response.success(res, analytics, 'Final analytics saved');
});

const getQuestions = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const { interviewType, difficulty, count, role } = req.body;
  const questions = await interviewService.generateQuestions(req.user.id, interviewType, difficulty, count, role);
  return response.success(res, questions);
});

const getDeepgramToken = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const aiService = require('../services/aiService');
  const tokenData = await aiService.getDeepgramToken();
  return response.success(res, tokenData);
});

const executeCode = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const { language, sourceCode, stdin } = req.body;
  const executionService = require('../services/interviewExecutionService');
  const result = await executionService.executeInterviewCode(language, sourceCode, stdin);
  return response.success(res, result);
});

const getHint = asyncHandler(async (req, res) => {
  if (!req.user) return response.unauthorized(res);
  const { language, sourceCode, questionDesc } = req.body;
  const aiService = require('../services/aiService');
  const result = await aiService.analyzeCode(language, sourceCode, questionDesc);
  return response.success(res, result);
});

const transcribeAudio = asyncHandler(async (req, res) => {
  const { audio_base64, sample_rate, interviewId } = req.body;
  const aiService = require('../services/aiService');
  const result = await aiService.transcribeAudio(audio_base64, sample_rate);

  // If transcription succeeded and we have a session ID, save analytics in the background
  if (result && !result.error && interviewId) {
    const interviewService = require('../services/interviewService');
    interviewService.saveAnalytics(parseInt(interviewId), {
      speakingPaceWpm: result.wpm,
      fillerWordCount: result.filler_count,
      speechClarity:   result.confidence, // Use confidence as a proxy for clarity
    }).catch(err => logger.warn(`[Whisper] Background analytics save failed: ${err.message}`));
  }

  return response.success(res, result);
});

module.exports = { 
  createSession, 
  endSession, 
  getMyInterviews, 
  getInterviewById, 
  saveAnalytics, 
  saveFinalAnalytics, 
  getQuestions, 
  getDeepgramToken, 
  executeCode, 
  getHint,
  transcribeAudio
};
