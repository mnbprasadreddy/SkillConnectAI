// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — AI Integration Service
// Orchestrates external AI APIs (Gemini, Deepgram, LanguageTool)
// ═══════════════════════════════════════════════════════════════

const axios = require('axios');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Generate highly relevant HR/Behavioral questions using Gemini.
 */
const generateHRQuestions = async (count = 5) => {
  if (!GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY is missing. Falling back to default HR questions.');
    return {
      questions: getDefaultHRQuestions(count),
      source: 'fallback',
      adaptation: 'API key missing, using standard fallback questions.'
    };
  }

  try {
    const prompt = `You are an expert HR Manager conducting a professional behavioral interview. 
Generate exactly ${count} highly professional, engaging HR/Behavioral interview questions.
The questions should cover topics like: teamwork, conflict resolution, strengths/weaknesses, and leadership.
Return ONLY a valid JSON array of strings containing the questions. Do not include any markdown formatting or explanations.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    }, { timeout: 15000 });

    const textResponse = response.data.candidates[0].content.parts[0].text;
    const questions = JSON.parse(textResponse);
    
    return {
      questions: questions,
      source: 'gemini',
      adaptation: 'AI generated HR behavioral questions.'
    };
  } catch (error) {
    logger.error('Failed to generate HR questions from Gemini:', error.message);
    return {
      questions: getDefaultHRQuestions(count),
      source: 'fallback',
      adaptation: 'AI generation failed, using standard fallback questions.'
    };
  }
};

const getDefaultHRQuestions = (count) => {
  const pool = [
    'Tell me about a time you had to work with a difficult team member.',
    'Describe a situation where you had to meet a tight deadline.',
    'What do you consider your greatest professional achievement?',
    'Tell me about a time you failed and what you learned from it.',
    'How do you prioritize your tasks when everything seems urgent?',
    'Why are you interested in this position?',
    'Describe a time you showed leadership without having a formal title.',
    'How do you handle receiving constructive criticism?'
  ];
  return pool.sort(() => 0.5 - Math.random()).slice(0, Math.min(count, pool.length));
};

/**
 * Provide a temporary Deepgram token for frontend WebSocket connection.
 */
const getDeepgramToken = async () => {
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

  if (!DEEPGRAM_API_KEY || DEEPGRAM_API_KEY.trim().length < 10) {
    logger.warn('[Deepgram] Token generation skipped — API key missing or too short. Returning mock token.');
    logger.warn('[Deepgram] Add DEEPGRAM_API_KEY=<your_key> to backend/.env and restart to enable Deepgram STT.');
    return { key: 'MOCK_DEEPGRAM_TOKEN', url: 'wss://mock.deepgram.com', status: 'mock' };
  }

  logger.info('[Deepgram] Generating realtime token...');

  // For security, ideally create a short-lived project key via Deepgram's /v1/projects/{id}/keys API.
  // For Render free-tier Phase 1, we pass the API key securely to the authenticated frontend user.
  logger.info('[Deepgram] Token generated successfully (direct API key mode)');
  return {
    key: DEEPGRAM_API_KEY,
    url: 'wss://api.deepgram.com/v1/listen',
    status: 'live',
  };
};

/**
 * Generate role-specific technical questions using Gemini.
 */
const generateTechnicalQuestions = async (role, difficulty, count = 5) => {
  if (!GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY is missing. Falling back to default technical questions.');
    return {
      questions: getDefaultTechnicalQuestions(role, count),
      source: 'fallback',
      adaptation: 'API key missing, using standard fallback questions.'
    };
  }

  try {
    const prompt = `You are an expert Senior Engineering Manager conducting a technical interview for a ${role} position.
The candidate's difficulty level is ${difficulty}.
Generate exactly ${count} highly technical, role-specific interview questions. 
For example, if the role is Frontend, ask about React, rendering logic, optimization. If DevOps, ask about Kubernetes, CI/CD, AWS.

Return ONLY a valid JSON array of objects. Do not include any markdown formatting or explanations.
Each object MUST have the following strict structure:
{
  "question": "The actual technical question string",
  "topic": "The core topic (e.g., 'React Hooks', 'Docker')",
  "difficulty": "Beginner, Intermediate, or Advanced",
  "expectedPoints": ["key point 1 to look for", "key point 2", "key point 3"]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    }, { timeout: 15000 });

    const textResponse = response.data.candidates[0].content.parts[0].text;
    const questions = JSON.parse(textResponse);
    
    return {
      questions: questions,
      source: 'gemini',
      adaptation: \`AI generated technical questions for \${role} at \${difficulty} level.\`
    };
  } catch (error) {
    logger.error('Failed to generate Technical questions from Gemini:', error.message);
    return {
      questions: getDefaultTechnicalQuestions(role, count),
      source: 'fallback',
      adaptation: 'AI generation failed, using standard fallback questions.'
    };
  }
};

const getDefaultTechnicalQuestions = (role, count) => {
  const roleMap = {
    'Frontend': [
      { question: 'Explain how React\'s Virtual DOM works and why it is efficient.', topic: 'React Internals', difficulty: 'Intermediate', expectedPoints: ['Diffing algorithm', 'Batch updates', 'Memory representation'] },
      { question: 'What are the main differences between useMemo and useCallback?', topic: 'React Hooks', difficulty: 'Intermediate', expectedPoints: ['Memoizing values vs functions', 'Reference equality', 'Performance optimization'] }
    ],
    'Backend': [
      { question: 'How do you prevent SQL injection in a Node.js API?', topic: 'Security', difficulty: 'Intermediate', expectedPoints: ['Prepared statements', 'Parameterized queries', 'Input validation'] },
      { question: 'Explain the difference between vertical and horizontal scaling.', topic: 'System Design', difficulty: 'Beginner', expectedPoints: ['Adding power vs adding machines', 'Load balancing', 'State management'] }
    ],
    'DevOps': [
      { question: 'Explain the architecture of Kubernetes.', topic: 'Kubernetes', difficulty: 'Intermediate', expectedPoints: ['Control plane', 'Worker nodes', 'Pods', 'Kubelet'] },
      { question: 'What is a multi-stage Docker build and why use it?', topic: 'Docker', difficulty: 'Beginner', expectedPoints: ['Smaller image size', 'Separating build tools from runtime', 'Security'] }
    ],
    'Full Stack': [
      { question: 'Describe how JWT authentication works end-to-end.', topic: 'Authentication', difficulty: 'Intermediate', expectedPoints: ['Stateless', 'Header/Payload/Signature', 'Local storage vs HttpOnly cookies'] },
      { question: 'What is a CORS error and how do you resolve it on the backend?', topic: 'Web Security', difficulty: 'Beginner', expectedPoints: ['Cross-Origin Resource Sharing', 'Preflight requests', 'Access-Control-Allow-Origin headers'] }
    ]
  };

  // Default to Full Stack if role not found
  let pool = roleMap[role] || roleMap['Full Stack'];
  
  // Pad with generic technical if pool is too small
  if (pool.length < count) {
    const generic = [
      { question: 'What is the time complexity of a hash map lookup?', topic: 'Data Structures', difficulty: 'Beginner', expectedPoints: ['O(1) average', 'O(n) worst case', 'Collisions'] },
      { question: 'Explain RESTful API principles.', topic: 'API Design', difficulty: 'Beginner', expectedPoints: ['Stateless', 'Client-server', 'Uniform interface', 'Cacheable'] }
    ];
    pool = [...pool, ...generic];
  }

  return pool.sort(() => 0.5 - Math.random()).slice(0, Math.min(count, pool.length));
};

/**
 * Generate coding questions for the Live Coding Interview.
 */
const generateCodingQuestions = async (difficulty, count = 2) => {
  if (!GEMINI_API_KEY) {
    return {
      questions: [
        { 
          question: "Write a function to reverse a string.", 
          topic: "Strings", 
          difficulty: "Beginner", 
          expectedPoints: ["O(n) time complexity", "In-place reversal if possible"] 
        }
      ],
      source: 'fallback'
    };
  }

  try {
    const prompt = `You are a strict FAANG technical interviewer.
Generate ${count} algorithmic coding questions at a ${difficulty} level.
Return ONLY a valid JSON array of objects. No markdown.
Format:
{
  "question": "The detailed problem description",
  "topic": "e.g., Arrays, Dynamic Programming",
  "difficulty": "Beginner, Intermediate, Advanced",
  "expectedPoints": ["O(n) time", "O(1) space"]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
    }, { timeout: 15000 });

    return {
      questions: JSON.parse(response.data.candidates[0].content.parts[0].text),
      source: 'gemini'
    };
  } catch (error) {
    logger.error('Failed to generate coding questions:', error.message);
    return { questions: [{ question: "Write a function to find the maximum element in an array.", topic: "Arrays", difficulty: "Beginner", expectedPoints: ["O(n) runtime"] }], source: 'fallback' };
  }
};

/**
 * Analyze a candidate's code explicitly (Hint requested or final submit).
 */
const analyzeCode = async (language, sourceCode, questionDesc) => {
  if (!GEMINI_API_KEY) return { hint: "Consider edge cases and time complexity.", edgeCases: ["Empty input", "Negative numbers"] };

  try {
    const prompt = `Analyze this ${language} code for the following problem: "${questionDesc}".
Code:
\`\`\`
${sourceCode}
\`\`\`
Provide a brief optimization hint, time/space complexity, and 2 edge cases to test.
Return ONLY valid JSON. Format:
{
  "hint": "Brief string",
  "timeComplexity": "e.g. O(n)",
  "spaceComplexity": "e.g. O(1)",
  "edgeCases": ["case 1", "case 2"]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
    }, { timeout: 15000 });

    return JSON.parse(response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    logger.error('AI Code Analysis failed:', error.message);
    return { hint: "Analysis unavailable. Check syntax and logic.", timeComplexity: "Unknown", spaceComplexity: "Unknown", edgeCases: [] };
  }
};

module.exports = {
  generateHRQuestions,
  getDeepgramToken,
  generateTechnicalQuestions,
  generateCodingQuestions,
  analyzeCode
};
