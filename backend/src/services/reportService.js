// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Report Service
// AI report generation using Gemini API
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const axios = require('axios');
const logger = require('../utils/logger');

const generateReport = async (interviewId) => {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { analytics: true, user: { select: { name: true, skillLevel: true } } },
  });

  if (!interview) throw Object.assign(new Error('Interview not found'), { statusCode: 404 });

  // Try AI service first (with timeout to prevent Render cold-start hangs)
  let aiReport = null;
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const resp = await axios.post(`${aiUrl}/api/ai/report/generate`, {
      interview_type: interview.interviewType,
      difficulty: interview.difficulty,
      score: interview.score,
      confidence_score: interview.confidenceScore,
      communication_score: interview.communicationScore,
      technical_score: interview.technicalScore,
      coding_score: interview.codingScore,
      // Send only a lightweight transcript summary, not the full stream
      transcript: interview.transcript ? interview.transcript.substring(0, 2000) : null,
      analytics: interview.analytics,
    }, { timeout: 10000 });
    aiReport = resp.data;
  } catch (err) {
    logger.warn('AI report service unavailable, generating basic report');
  }

  // Guard against malformed AI responses
  const strengths = (typeof aiReport?.strengths === 'string' ? aiReport.strengths : null) || generateBasicStrengths(interview);
  const weaknesses = (typeof aiReport?.weaknesses === 'string' ? aiReport.weaknesses : null) || generateBasicWeaknesses(interview);
  const recs = (typeof aiReport?.recommendations === 'string' ? aiReport.recommendations : null) || 'Continue practicing and focus on areas with lower scores.';
  const summary = (typeof aiReport?.summary === 'string' ? aiReport.summary : null) || `Interview completed with an overall score of ${interview.score || 'N/A'}.`;

  const report = await prisma.report.upsert({
    where: { interviewId },
    update: { strengths, weaknesses, recommendations: recs, aiSummary: summary },
    create: { interviewId, strengths, weaknesses, recommendations: recs, aiSummary: summary },
  });

  return report;
};

const getReport = async (interviewId) => {
  return await prisma.report.findUnique({ where: { interviewId } });
};

const getReportsByUser = async (userId) => {
  return await prisma.report.findMany({
    where: { interview: { userId } },
    include: { interview: { select: { interviewType: true, difficulty: true, score: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

function generateBasicStrengths(interview) {
  const strengths = [];
  if (interview.confidenceScore >= 70) strengths.push('Strong confidence during the interview');
  if (interview.communicationScore >= 70) strengths.push('Good communication skills');
  if (interview.technicalScore >= 70) strengths.push('Solid technical knowledge');
  if (interview.codingScore >= 70) strengths.push('Excellent coding proficiency and algorithmic logic');
  if (interview.analytics?.eyeContactScore >= 70) strengths.push('Maintained good eye contact');
  return strengths.length > 0 ? strengths.join('. ') + '.' : 'Interview completed successfully.';
}

function generateBasicWeaknesses(interview) {
  const weaknesses = [];
  if (interview.confidenceScore && interview.confidenceScore < 50) weaknesses.push('Work on building confidence');
  if (interview.communicationScore && interview.communicationScore < 50) weaknesses.push('Improve communication clarity');
  if (interview.technicalScore && interview.technicalScore < 50) weaknesses.push('Strengthen technical fundamentals');
  if (interview.codingScore && interview.codingScore < 50) weaknesses.push('Focus on optimizing algorithms and identifying edge cases');
  if (interview.analytics?.nervousnessScore && interview.analytics.nervousnessScore > 60) weaknesses.push('Practice managing nervousness');
  return weaknesses.length > 0 ? weaknesses.join('. ') + '.' : 'No significant weaknesses identified.';
}

module.exports = { generateReport, getReport, getReportsByUser };
