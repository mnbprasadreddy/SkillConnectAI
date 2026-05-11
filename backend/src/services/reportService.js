// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Report Service (v2)
// AI report generation using Gemini.
// Prompt is kept lightweight — truncated transcript, summarized analytics.
// Graceful fallback on all failure paths.
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const axios  = require('axios');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ─── Gemini report generation ─────────────────────────────────────
// Sends a LIGHTWEIGHT prompt — never dumps entire transcript or raw analytics.

async function generateGeminiReport(interview) {
  if (!GEMINI_API_KEY) return null;

  const { interviewType, difficulty, role, score, confidenceScore,
          communicationScore, technicalScore, codingScore, transcript, analytics } = interview;

  // Truncate transcript: first 1200 chars + last 1200 chars only (constraint #5)
  let transcriptSummary = '';
  if (transcript && transcript.length > 0) {
    const t = transcript.trim();
    if (t.length <= 2400) {
      transcriptSummary = t;
    } else {
      transcriptSummary = `[Opening]\n${t.slice(0, 1200)}\n\n[Closing]\n${t.slice(-1200)}`;
    }
  }

  // Summarize analytics — never send raw object
  const analyticsSummary = analytics ? [
    analytics.eyeContactScore    != null ? `Eye contact: ${Math.round(analytics.eyeContactScore)}%`       : null,
    analytics.nervousnessScore   != null ? `Nervousness: ${Math.round(analytics.nervousnessScore)}%`      : null,
    analytics.speechClarity      != null ? `Speech clarity: ${Math.round(analytics.speechClarity)}%`      : null,
    analytics.smileFrequency     != null ? `Smile frequency: ${analytics.smileFrequency.toFixed(1)}/min`  : null,
    analytics.fillerWordCount    != null ? `Filler words: ${analytics.fillerWordCount}`                   : null,
    analytics.speakingPaceWpm    != null ? `Speaking pace: ${analytics.speakingPaceWpm} wpm`              : null,
    analytics.attentionStability != null ? `Attention stability: ${Math.round(analytics.attentionStability)}%` : null,
  ].filter(Boolean).join(', ') : 'No biometric data available';

  const prompt = `You are an expert interview coach. Generate a structured interview performance report.

Interview: ${interviewType?.toUpperCase()} | Role: ${role || 'General'} | Difficulty: ${difficulty}
Scores: Overall=${score ?? 'N/A'}/100, Confidence=${confidenceScore ?? 'N/A'}/100, Communication=${communicationScore ?? 'N/A'}/100, Technical=${technicalScore ?? 'N/A'}/100${codingScore != null ? `, Coding=${codingScore}/100` : ''}
Biometrics: ${analyticsSummary}
${transcriptSummary ? `\nTranscript excerpt:\n${transcriptSummary}` : ''}

Return ONLY valid JSON with this exact structure:
{
  "aiSummary": "2-3 sentence overall performance summary",
  "strengths": "Comma-separated strength areas",
  "weaknesses": "Comma-separated improvement areas",
  "recommendations": "3 specific actionable next steps",
  "careerSummary": "1 sentence career readiness assessment",
  "weakConcepts": ["concept1", "concept2", "concept3"]
}`;

  try {
    const { data } = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600, responseMimeType: 'application/json' },
      },
      { timeout: 15000 },
    );

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    const status = err?.response?.status;
    logger.warn(`[ReportService] Gemini failed (status=${status}): ${err.message}`);
    return null;
  }
}

// ─── Main report generator ────────────────────────────────────────

const generateReport = async (interviewId) => {
  const interview = await prisma.interview.findUnique({
    where:   { id: interviewId },
    include: { analytics: true, user: { select: { name: true, skillLevel: true } } },
  });

  if (!interview) throw Object.assign(new Error('Interview not found'), { statusCode: 404 });

  // Try Gemini report
  let geminiReport = null;
  try {
    geminiReport = await generateGeminiReport(interview);
  } catch (err) {
    logger.warn('[ReportService] Gemini report generation error:', err.message);
  }

  // Fallback to rule-based if Gemini unavailable
  const strengths       = safeStr(geminiReport?.strengths)       || generateBasicStrengths(interview);
  const weaknesses      = safeStr(geminiReport?.weaknesses)      || generateBasicWeaknesses(interview);
  const recommendations = safeStr(geminiReport?.recommendations) || 'Continue practicing and focus on areas with lower scores.';
  const aiSummary       = safeStr(geminiReport?.aiSummary)       || `${interview.interviewType} interview completed. Overall score: ${interview.score ?? 'N/A'}/100.`;
  const careerSummary   = safeStr(geminiReport?.careerSummary)   || null;

  // weakConcepts: validate it's an array of strings
  let weakConcepts = null;
  if (Array.isArray(geminiReport?.weakConcepts)) {
    weakConcepts = geminiReport.weakConcepts.filter(c => typeof c === 'string').slice(0, 6);
  }

  // codingAccuracy: derive from codingScore if present
  const codingAccuracy = interview.codingScore != null
    ? parseFloat((interview.codingScore).toFixed(1))
    : null;

  const report = await prisma.report.upsert({
    where:  { interviewId },
    update: { strengths, weaknesses, recommendations, aiSummary, careerSummary, weakConcepts, codingAccuracy },
    create: { interviewId, strengths, weaknesses, recommendations, aiSummary, careerSummary, weakConcepts, codingAccuracy },
  });

  logger.info(`[ReportService] Report generated for interview ${interviewId}`);
  return report;
};

// ─── Read helpers ─────────────────────────────────────────────────

const getReport = async (interviewId) => {
  return await prisma.report.findUnique({ where: { interviewId } });
};

const getReportsByUser = async (userId) => {
  return await prisma.report.findMany({
    where:   { interview: { userId } },
    include: { interview: { select: { interviewType: true, difficulty: true, score: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

// ─── Rule-based fallbacks ─────────────────────────────────────────

function safeStr(val) {
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : null;
}

function generateBasicStrengths(interview) {
  const s = [];
  if ((interview.confidenceScore    ?? 0) >= 70) s.push('Strong confidence during the interview');
  if ((interview.communicationScore ?? 0) >= 70) s.push('Good communication skills');
  if ((interview.technicalScore     ?? 0) >= 70) s.push('Solid technical knowledge');
  if ((interview.codingScore        ?? 0) >= 70) s.push('Excellent coding proficiency');
  if ((interview.analytics?.eyeContactScore ?? 0) >= 70) s.push('Maintained good eye contact');
  return s.length > 0 ? s.join('. ') + '.' : 'Interview completed successfully.';
}

function generateBasicWeaknesses(interview) {
  const w = [];
  if (interview.confidenceScore    != null && interview.confidenceScore    < 50) w.push('Build confidence');
  if (interview.communicationScore != null && interview.communicationScore < 50) w.push('Improve communication clarity');
  if (interview.technicalScore     != null && interview.technicalScore     < 50) w.push('Strengthen technical fundamentals');
  if (interview.codingScore        != null && interview.codingScore        < 50) w.push('Focus on algorithm optimization');
  if ((interview.analytics?.nervousnessScore ?? 0) > 60) w.push('Practice managing nervousness');
  return w.length > 0 ? w.join('. ') + '.' : 'No significant weaknesses identified.';
}

module.exports = { generateReport, getReport, getReportsByUser };
