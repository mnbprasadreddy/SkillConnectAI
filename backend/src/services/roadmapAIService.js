// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Roadmap AI Service (Gemini Integration)
// Generates structured roadmaps with detailed module content.
// Called ONLY on admin creation — never on page load.
// Content is stored permanently in DB; never regenerated.
// Falls back gracefully if Gemini is unavailable.
// ═══════════════════════════════════════════════════════════════

const axios = require('axios');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

/**
 * Generate a complete roadmap with fully-detailed modules for a given topic.
 * Each module includes theory, examples, code, best practices, and exercises.
 * Content is CONCISE — no essays, no large markdown, only structured JSON.
 *
 * @param {string} topic - e.g. "Arrays", "Dynamic Programming"
 * @param {string} roleTrack - e.g. "Full Stack", "Backend", "AI/ML"
 * @param {string} difficulty - e.g. "Beginner", "Intermediate", "Advanced"
 * @returns {Object} { topic, description, totalModules, modules[] }
 */
async function generateRoadmap(topic, roleTrack = 'Full Stack', difficulty = 'Beginner') {
  if (!GEMINI_API_KEY) {
    logger.warn('[RoadmapAI] GEMINI_API_KEY missing — using fallback roadmap');
    return buildFallbackRoadmap(topic, roleTrack, difficulty);
  }

  try {
    const prompt = buildPrompt(topic, roleTrack, difficulty);

    const response = await axios.post(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: 'application/json',
      },
    }, { timeout: 45000 });

    const textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      logger.error('[RoadmapAI] Empty Gemini response — using fallback');
      return buildFallbackRoadmap(topic, roleTrack, difficulty);
    }

    const parsed = JSON.parse(textResponse);

    if (!parsed.modules || !Array.isArray(parsed.modules) || parsed.modules.length === 0) {
      logger.error('[RoadmapAI] Invalid Gemini structure — using fallback');
      return buildFallbackRoadmap(topic, roleTrack, difficulty);
    }

    const modules = parsed.modules.map((m, i) => ({
      title:            m.title || `Module ${i + 1}`,
      description:      m.description || '',
      difficulty:       m.difficulty || difficulty,
      orderIndex:       i,
      estimatedHours:   m.estimatedHours || 2,
      concepts:         Array.isArray(m.concepts)         ? m.concepts         : [],
      milestones:       Array.isArray(m.milestones)       ? m.milestones       : [],
      checkpoints:      Array.isArray(m.checkpoints)      ? m.checkpoints      : [],
      // ─── New detailed content fields ───
      theory:           m.theory           || buildFallbackTheory(m.title || topic),
      examples:         Array.isArray(m.examples)         ? m.examples         : [],
      codeSnippets:     Array.isArray(m.codeSnippets)     ? m.codeSnippets     : [],
      bestPractices:    Array.isArray(m.bestPractices)    ? m.bestPractices    : [],
      commonMistakes:   Array.isArray(m.commonMistakes)   ? m.commonMistakes   : [],
      interviewTips:    Array.isArray(m.interviewTips)    ? m.interviewTips    : [],
      miniExercises:    Array.isArray(m.miniExercises)    ? m.miniExercises    : [],
      practiceProblems: Array.isArray(m.practiceProblems) ? m.practiceProblems : [],
    }));

    return {
      topic:        parsed.topic       || topic,
      description:  parsed.description || `AI-generated learning path for ${topic}`,
      totalModules: modules.length,
      modules,
    };
  } catch (err) {
    logger.error('[RoadmapAI] Gemini call failed:', err.message);
    return buildFallbackRoadmap(topic, roleTrack, difficulty);
  }
}

// ─── Prompt Builder ─────────────────────────────────────────────
// IMPORTANT: Prompts are designed to be CONCISE.
// Gemini must return short, structured JSON only — no essays.

function buildPrompt(topic, roleTrack, difficulty) {
  return `You are an expert software engineering curriculum designer for a coding interview prep platform.

Generate a learning roadmap for: "${topic}"
Role: ${roleTrack} | Starting Difficulty: ${difficulty}

STRICT RULES:
- Generate 6-10 progressive modules
- ALL text values must be SHORT (max 1-2 sentences, max 5 bullet items per array)
- Return ONLY valid JSON — no markdown, no extra text
- Code snippets must be short (max 10 lines)
- theory.overview: 1-2 sentences only
- theory.whenToUse: max 3 bullet strings

Return this EXACT JSON structure:
{
  "topic": "${topic}",
  "description": "One-line description of this learning path",
  "modules": [
    {
      "title": "Module title",
      "description": "One-line description",
      "difficulty": "Beginner|Intermediate|Advanced",
      "estimatedHours": 2,
      "concepts": ["Concept 1", "Concept 2"],
      "milestones": ["Milestone 1"],
      "checkpoints": ["Can you explain X?"],
      "theory": {
        "overview": "Short overview of this module topic.",
        "whenToUse": ["Use case 1", "Use case 2"]
      },
      "examples": [
        { "title": "Example title", "explanation": "One-line explanation of the example." }
      ],
      "codeSnippets": [
        { "language": "javascript", "label": "Basic usage", "code": "// short code here\\nconst x = 1;" }
      ],
      "bestPractices": ["Practice 1", "Practice 2"],
      "commonMistakes": ["Mistake 1", "Mistake 2"],
      "interviewTips": ["Tip 1", "Tip 2"],
      "miniExercises": ["Exercise 1", "Exercise 2"],
      "practiceProblems": ["Problem title or LeetCode number"]
    }
  ]
}

Generate at least 6 modules with progressively increasing difficulty. Keep all content short and concise.`;
}

// ─── Fallback theory helper ──────────────────────────────────────

function buildFallbackTheory(title) {
  return {
    overview: `${title} is a fundamental concept in computer science and software engineering.`,
    whenToUse: ['When solving optimization problems', 'When working with structured data'],
  };
}

// ─── Fallback Roadmap (when Gemini fails) ───────────────────────
// Generates a concise, 5-module fallback with all content fields populated.

function buildFallbackRoadmap(topic, roleTrack, difficulty) {
  const modules = [
    {
      title: `${topic} — Foundations`,
      description: `Core concepts and terminology of ${topic}.`,
      difficulty: 'Beginner',
      orderIndex: 0,
      estimatedHours: 2,
      concepts: ['Introduction', 'Basic Operations', 'Common Patterns'],
      milestones: ['Complete 3 beginner exercises'],
      checkpoints: ['Explain the basics of this topic'],
      theory: {
        overview: `${topic} is a foundational concept used across many areas of software development.`,
        whenToUse: ['When handling structured data', 'When solving iteration-based problems'],
      },
      examples: [
        { title: 'Basic Example', explanation: 'A simple demonstration of the core concept.' },
      ],
      codeSnippets: [
        { language: 'javascript', label: 'Basic usage', code: `// Example: ${topic}\nconst data = [];\ndata.push('item');` },
      ],
      bestPractices: ['Understand the fundamentals before moving to patterns', 'Write readable code first'],
      commonMistakes: ['Skipping edge cases', 'Ignoring time complexity'],
      interviewTips: ['Be able to explain the concept in plain English', 'Know the time and space complexity'],
      miniExercises: ['Implement a basic version from scratch', 'Trace through a small example by hand'],
      practiceProblems: ['Easy warm-up problems on this topic'],
    },
    {
      title: `${topic} — Core Techniques`,
      description: `Essential patterns and standard approaches.`,
      difficulty: 'Beginner',
      orderIndex: 1,
      estimatedHours: 3,
      concepts: ['Pattern Recognition', 'Standard Approaches', 'Edge Cases'],
      milestones: ['Solve 5 Easy problems'],
      checkpoints: ['Identify which technique to apply'],
      theory: {
        overview: `Building on the basics, this module covers the most common patterns used with ${topic}.`,
        whenToUse: ['When a problem involves repeated sub-problems', 'When inputs have a predictable structure'],
      },
      examples: [
        { title: 'Pattern Application', explanation: 'Applying a standard pattern to a common problem type.' },
      ],
      codeSnippets: [
        { language: 'javascript', label: 'Common pattern', code: `// Pattern for ${topic}\nfor (let i = 0; i < n; i++) {\n  // process element\n}` },
      ],
      bestPractices: ['Recognize the pattern before coding', 'Test with edge cases early'],
      commonMistakes: ['Off-by-one errors', 'Not handling empty inputs'],
      interviewTips: ['Name the pattern you are using', 'State constraints before starting'],
      miniExercises: ['Implement without hints', 'Handle the empty input case'],
      practiceProblems: ['LeetCode Easy — topic-specific'],
    },
    {
      title: `${topic} — Intermediate Patterns`,
      description: `Harder patterns and complexity analysis.`,
      difficulty: 'Intermediate',
      orderIndex: 2,
      estimatedHours: 4,
      concepts: ['Optimization', 'Multi-step Solutions', 'Complexity Analysis'],
      milestones: ['Solve 3 Medium problems'],
      checkpoints: ['Analyze time and space complexity'],
      theory: {
        overview: `This module explores more complex patterns that require combining multiple techniques.`,
        whenToUse: ['When brute force is too slow', 'When multiple passes are needed'],
      },
      examples: [
        { title: 'Optimization Example', explanation: 'Reducing time complexity from O(n²) to O(n).' },
      ],
      codeSnippets: [
        { language: 'javascript', label: 'Optimized approach', code: `// Optimized O(n) solution\nconst map = new Map();\nfor (const item of arr) {\n  map.set(item, (map.get(item) || 0) + 1);\n}` },
      ],
      bestPractices: ['Always state complexity', 'Prefer O(n) over O(n²) when possible'],
      commonMistakes: ['Using nested loops unnecessarily', 'Forgetting to handle duplicates'],
      interviewTips: ['Propose brute force first, then optimize', 'Draw diagrams to explain your thinking'],
      miniExercises: ['Optimize a slow solution', 'Calculate complexity of your solution'],
      practiceProblems: ['LeetCode Medium — topic-specific'],
    },
    {
      title: `${topic} — Advanced Applications`,
      description: `Real-world applications and system design context.`,
      difficulty: 'Intermediate',
      orderIndex: 3,
      estimatedHours: 5,
      concepts: ['System Design Integration', 'Performance Tuning', 'Trade-offs'],
      milestones: ['Solve 2 Medium problems under time pressure'],
      checkpoints: ['Design a solution for a real-world scenario'],
      theory: {
        overview: `Advanced usage of ${topic} in real-world systems and design tradeoffs.`,
        whenToUse: ['In production system design', 'When performance is a constraint'],
      },
      examples: [
        { title: 'Real-World Use Case', explanation: 'How this concept appears in production systems.' },
      ],
      codeSnippets: [
        { language: 'javascript', label: 'Production pattern', code: `// Real-world implementation\nclass DataProcessor {\n  process(data) {\n    // efficient processing\n  }\n}` },
      ],
      bestPractices: ['Think about scalability upfront', 'Document trade-offs in your solution'],
      commonMistakes: ['Premature optimization', 'Ignoring edge cases at scale'],
      interviewTips: ['Discuss memory vs. speed trade-offs', 'Mention real-world constraints'],
      miniExercises: ['Design a system that uses this concept', 'Identify bottlenecks in an existing solution'],
      practiceProblems: ['LeetCode Medium/Hard — system design variant'],
    },
    {
      title: `${topic} — Mastery & Interview Prep`,
      description: `Expert-level challenges and interview preparation.`,
      difficulty: 'Advanced',
      orderIndex: 4,
      estimatedHours: 6,
      concepts: ['Hard Problem Patterns', 'Interview Strategies', 'Code Review'],
      milestones: ['Solve 2 Hard problems', 'Pass a mock interview on this topic'],
      checkpoints: ['Teach this topic to someone else'],
      theory: {
        overview: `Master-level understanding combining all previous concepts for interview excellence.`,
        whenToUse: ['In competitive programming', 'In FAANG-level interviews'],
      },
      examples: [
        { title: 'Hard Problem Walkthrough', explanation: 'Step-by-step breakdown of a difficult problem.' },
      ],
      codeSnippets: [
        { language: 'javascript', label: 'Advanced solution', code: `// Advanced technique\nfunction solve(input) {\n  // multi-step optimized solution\n  return result;\n}` },
      ],
      bestPractices: ['Practice explaining out loud', 'Review your own code critically'],
      commonMistakes: ['Rushing to code without planning', 'Not communicating thought process'],
      interviewTips: ['Always clarify the problem before coding', 'Think out loud throughout the interview'],
      miniExercises: ['Do a timed mock problem', 'Review and explain a solution you wrote yesterday'],
      practiceProblems: ['LeetCode Hard — topic-specific', 'Google/Meta interview problems on this topic'],
    },
  ];

  return {
    topic,
    description: `Structured learning path for ${topic} (${roleTrack})`,
    totalModules: modules.length,
    modules,
  };
}

module.exports = { generateRoadmap };
