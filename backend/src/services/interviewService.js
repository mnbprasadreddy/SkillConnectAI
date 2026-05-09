// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Interview Service (v2)
// Complete session lifecycle: create → analytics → end → report
// ═══════════════════════════════════════════════════════════════

const prisma = require('../config/database');
const axios = require('axios');
const logger = require('../utils/logger');
const { emitInterviewAnalytics, emitInterviewScoreUpdate, emitInterviewQuestion } = require('../socket/socketManager');

/**
 * Create a new interview session
 */
const createSession = async (userId, interviewType, difficulty, role) => {
  const session = await prisma.interview.create({
    data: {
      userId,
      interviewType,
      difficulty,
      role: role || null,
      status: 'in_progress',
    },
  });

  logger.info(`New interview session created: ${session.id} for user ${userId}`);
  return session;
};

/**
 * End an interview session with scores and trigger report generation
 */
const endSession = async (interviewId, data) => {
  try {
    // 1. Update interview status and primary scores
    const interview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: 'completed',
        duration: data.duration || 0,
        score: data.score || null,
        confidenceScore: data.confidenceScore || null,
        communicationScore: data.communicationScore || null,
        technicalScore: data.technicalScore || null,
        codingScore: data.codingScore || null,
        recordingUrl: data.recordingUrl || null,
        transcript: data.transcript || null,
      },
      include: { analytics: true },
    });

    // 2. Trigger AI report generation in the background
    const reportService = require('./reportService');
    reportService.generateReport(interviewId).catch((err) => {
      logger.error(`Background report generation failed for interview ${interviewId}:`, err.message);
    });

    // 3. Update user recommendations (background)
    const recommendationService = require('./recommendationService');
    recommendationService.generateRecommendations(interview.userId).catch((err) => {
      logger.warn('Background recommendation refresh failed:', err.message);
    });

    // 4. Emit final scores via socket
    emitInterviewScoreUpdate(interviewId, {
      score: interview.score,
      confidence: interview.confidenceScore,
      communication: interview.communicationScore,
      technical: interview.technicalScore,
    });

    return interview;
  } catch (error) {
    logger.error(`Error ending interview session ${interviewId}:`, error.message);
    throw error;
  }
};

/**
 * Get all interviews for a user with pagination
 */
const getInterviewsByUser = async (userId, { page, limit, offset }) => {
  const [interviews, totalCount] = await Promise.all([
    prisma.interview.findMany({
      where: { userId },
      include: {
        analytics: true,
        report: { select: { id: true, aiSummary: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.interview.count({ where: { userId } }),
  ]);

  return { interviews, totalCount };
};

/**
 * Get a single interview with full details
 */
const getInterviewById = async (id) => {
  return await prisma.interview.findUnique({
    where: { id },
    include: {
      analytics: true,
      report: true,
      user: {
        select: { id: true, name: true, profileImage: true },
      },
    },
  });
};

/**
 * Save interview analytics and emit real-time updates
 */
const saveAnalytics = async (interviewId, analyticsData) => {
  try {
    const analytics = await prisma.interviewAnalytic.upsert({
      where: { interviewId },
      update: {
        eyeContactScore: analyticsData.eyeContactScore,
        postureScore: analyticsData.postureScore,
        speechClarity: analyticsData.speechClarity,
        nervousnessScore: analyticsData.nervousnessScore,
        speakingSpeed: analyticsData.speakingSpeed,
        emotionDetected: analyticsData.emotionDetected,
      },
      create: {
        interviewId,
        eyeContactScore: analyticsData.eyeContactScore,
        postureScore: analyticsData.postureScore,
        speechClarity: analyticsData.speechClarity,
        nervousnessScore: analyticsData.nervousnessScore,
        speakingSpeed: analyticsData.speakingSpeed,
        emotionDetected: analyticsData.emotionDetected,
      },
    });

    // Emit live update to client
    emitInterviewAnalytics(interviewId, analytics);

    return analytics;
  } catch (error) {
    logger.error(`Error saving analytics for interview ${interviewId}:`, error.message);
    throw error;
  }
};

/**
 * Generate interview questions using AI service or fallback
 */
const generateQuestions = async (userId, interviewType, difficulty, count = 5, role) => {
  try {
    // Phase 1: Route HR and Behavioral interviews to the new Node.js aiService (Gemini)
    if (interviewType === 'hr' || interviewType === 'behavioral') {
      const aiService = require('./aiService');
      return await aiService.generateHRQuestions(count);
    }

    // Phase 2: Route Role-Based Technical interviews to Gemini
    if (interviewType === 'technical' && role) {
      const aiService = require('./aiService');
      return await aiService.generateTechnicalQuestions(role, difficulty, count);
    }

    // Phase 3: Route Live Coding interviews to Gemini
    if (interviewType === 'coding') {
      const aiService = require('./aiService');
      return await aiService.generateCodingQuestions(difficulty, count);
    }

    // Existing technical/coding logic relies on the Python AI microservice
    const recommendationService = require('./recommendationService');
    let focusTopics = [];
    
    if (interviewType === 'technical' || interviewType === 'coding') {
      try {
        const { weakTopics } = await recommendationService.getWeakTopics(userId);
        focusTopics = weakTopics.map(wt => wt.topic);
      } catch (err) {
        logger.warn('Failed to fetch weak topics for interview generation:', err.message);
      }
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.post(`${aiServiceUrl}/api/ai/interview/questions`, {
      interview_type: interviewType,
      difficulty,
      count,
      focus_topics: focusTopics
    }, { timeout: 10000 });

    if (response.data && response.data.questions) {
      return response.data;
    }
    
    throw new Error('Invalid response from AI service');
  } catch (error) {
    logger.warn('Failed to generate interview questions from AI service, using fallback:', error.message);
    return {
      questions: getDefaultQuestions(interviewType, count),
      source: 'fallback',
      adaptation: 'AI adaptation failed, using standard fallback questions.'
    };
  }
};

/**
 * Default questions bank
 */
const getDefaultQuestions = (type, count) => {
  const questionBank = {
    behavioral: [
      'Tell me about yourself and your background.',
      'Describe a challenging project you worked on.',
      'How do you handle disagreements with team members?',
      'Tell me about a time you failed and what you learned.',
      'Where do you see yourself in 5 years?',
      'Describe a time you had to learn something quickly.',
      'How do you prioritize your work?',
    ],
    technical: [
      'Explain the difference between REST and GraphQL.',
      'What is the time complexity of quicksort?',
      'Explain how a hash table works internally.',
      'What are SOLID principles? Give examples.',
      'Explain the difference between SQL and NoSQL databases.',
      'What is the CAP theorem?',
      'How does garbage collection work?',
    ],
    system_design: [
      'Design a URL shortener like bit.ly.',
      'How would you design a chat application?',
      'Design a notification system.',
      'How would you design a rate limiter?',
      'Design a file storage system like Dropbox.',
    ],
    coding: [
      'Reverse a linked list.',
      'Find the longest substring without repeating characters.',
      'Implement a LRU cache.',
      'Find the median of two sorted arrays.',
      'Implement a trie data structure.',
    ],
    hr: [
      'Why do you want to work at our company?',
      'What are your salary expectations?',
      'What motivates you in your work?',
      'Describe your ideal work environment.',
      'Do you prefer working alone or in a team?',
    ],
  };

  const pool = questionBank[type] || questionBank.behavioral;
  return pool.sort(() => 0.5 - Math.random()).slice(0, Math.min(count, pool.length));
};

module.exports = {
  createSession,
  endSession,
  getInterviewsByUser,
  getInterviewById,
  saveAnalytics,
  generateQuestions,
};
