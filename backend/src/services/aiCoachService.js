// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — AI Coach Service (Gemini Integration)
// Single-turn prompt architecture — avoids Gemini role-ordering
// issues from multi-turn history injection.
// Falls back ONLY on actual API failure or timeout.
// ═══════════════════════════════════════════════════════════════

const axios = require('axios');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const TIMEOUT_MS     = 15000;

// ─── Build a single rich prompt string ───────────────────────────
// Includes system role, user context, conversation history, and
// the current question — all as ONE user turn.
// This sidesteps Gemini's strict role-alternation requirement.

function buildPrompt(userMessage, history = [], context = {}) {
  const weakTopics       = Array.isArray(context.weakTopics)       ? context.weakTopics       : [];
  const roadmapProgress  = Array.isArray(context.roadmapProgress)  ? context.roadmapProgress  : [];
  const recentInterviews = Array.isArray(context.recentInterviews) ? context.recentInterviews : [];

  // ── Context block ───────────────────────────────────────────
  const ctxLines = [];
  if (weakTopics.length > 0) {
    ctxLines.push(`Weak topics: ${weakTopics.map(w => `${w.topic} (${w.severity})`).join(', ')}`);
  }
  if (roadmapProgress.length > 0) {
    ctxLines.push(`Active roadmaps: ${roadmapProgress.map(r => `${r.title} — ${r.progressPercent}% done`).join(', ')}`);
  }
  if (recentInterviews.length > 0) {
    ctxLines.push(`Recent interview scores: ${recentInterviews.map(i => `${i.type} ${i.score ?? 'N/A'}/100`).join(', ')}`);
  }
  const contextBlock = ctxLines.length > 0
    ? `\nUser context:\n${ctxLines.join('\n')}`
    : '';

  // ── Conversation history block ──────────────────────────────
  // Only include real back-and-forth, not the welcome message.
  const safeHistory = Array.isArray(history) ? history.filter(
    m => m && m.role && m.content &&
         m.role !== 'assistant' || // strip AI intro message role
         (m.role === 'assistant' && !m.content.includes("Hi! I'm **SkillConnect AI Coach**"))
  ) : [];

  const historyBlock = safeHistory.length > 0
    ? '\nPrevious conversation:\n' +
      safeHistory.slice(-6).map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n')
    : '';

  return `You are SkillConnect AI Coach — an expert coding mentor and interview coach.

Your capabilities:
- Explain Data Structures & Algorithms (DSA) clearly
- Coach users for technical and HR interviews
- Guide learning roadmaps and suggest what to study next
- Help with weak topic improvement
- Answer platform-related questions

Rules:
- Be concise and practical (under 250 words unless user asks for detail)
- Use bullet points for lists
- Use **bold** for key terms
- Always end with a concrete next step
- Reference the user's context when relevant${contextBlock}${historyBlock}

Now answer this user question:
${userMessage}`;
}

// ─── Main chat function ──────────────────────────────────────────

async function chat(userMessage, history = [], context = {}) {
  const message = typeof userMessage === 'string' ? userMessage.trim().slice(0, 1000) : '';
  if (!message) return 'Please enter a message so I can help you!';

  if (!GEMINI_API_KEY) {
    logger.warn('[AICoach] GEMINI_API_KEY not set — using keyword fallback');
    return getFallbackResponse(message);
  }

  const prompt = buildPrompt(message, history, context);

  logger.info(`[AICoach] Calling Gemini | message: "${message.slice(0, 60)}..."`);

  try {
    const { data } = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
        ],
        generationConfig: {
          temperature:     0.75,
          maxOutputTokens: 600,
        },
      },
      { timeout: TIMEOUT_MS },
    );

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply || typeof reply !== 'string' || !reply.trim()) {
      logger.warn('[AICoach] Gemini returned empty reply');
      return getFallbackResponse(message);
    }

    logger.info(`[AICoach] Gemini OK — ${reply.length} chars`);
    return reply.trim().slice(0, 2000);

  } catch (err) {
    const status = err.response?.status;
    const errBody = JSON.stringify(err.response?.data)?.slice(0, 300) || err.message;

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      logger.warn('[AICoach] Gemini timed out');
      return "I'm thinking a bit slowly — please try again in a moment! 🔄";
    }

    logger.error(`[AICoach] Gemini failed | status: ${status} | body: ${errBody}`);

    if (status === 403 || status === 401) {
      return "⚠️ **AI Coach configuration issue:** The Gemini API key is invalid or expired. Please ask your administrator to update the `GEMINI_API_KEY` in the backend `.env` file with a valid key from https://aistudio.google.com/app/apikey — then restart the backend server.";
    }

    return getFallbackResponse(message);
  }
}

// ─── Fallback — only used when Gemini is actually unreachable ────

function getFallbackResponse(message = '') {
  const q = message.toLowerCase();

  if (q.includes('after array') || q.includes('learn next') || q.includes('what next'))
    return "**After Arrays, I recommend:**\n\n1. **HashMaps & Sets** — O(1) lookup, frequency counting\n2. **Two Pointers** — pair sum, container with most water\n3. **Sliding Window** — max subarray, longest substring\n4. **Prefix Sum** — range queries in O(1)\n\nStart with Two Pointers — easiest transition from Arrays!";

  if (q.includes('sliding window'))
    return "**Sliding Window** — optimizes contiguous subarray/substring problems.\n\n**Idea:** Expand right pointer, shrink left when condition breaks. O(n) vs O(n²) brute force.\n\n**Classic problems:** Max subarray, Longest substring without repeats (LeetCode 3, 209, 643).";

  if (q.includes('dynamic programming') || /\bdp\b/.test(q))
    return "**Dynamic Programming (DP):** Break problems into overlapping subproblems, cache results.\n\n- **Top-down:** Recursion + memoization\n- **Bottom-up:** Iterative table\n\n**Start with:** Fibonacci → Climbing Stairs → Coin Change.";

  if (q.includes('graph') || q.includes('bfs') || q.includes('dfs'))
    return "**Graph traversal:**\n\n- **BFS** — shortest path (unweighted). Use Queue.\n- **DFS** — all paths, topological sort. Use Stack/Recursion.\n\n**Must-solve:** Number of Islands, Course Schedule, Shortest Path Binary Matrix.";

  if (q.includes('interview') || q.includes('hr') || q.includes('prep'))
    return "**Interview preparation:**\n\n1. Master DSA patterns (Two Pointers, DP, BFS/DFS)\n2. Practice STAR method for HR questions\n3. Mock interviews — use SkillConnect's Interview section\n4. Review time & space complexity after every solution.";

  if (q.includes('roadmap') || q.includes('plan') || q.includes('path'))
    return "**Recommended learning sequence:**\n\nArrays → HashMaps → Two Pointers → Sliding Window → Binary Search → Trees → Graphs → DP\n\nCheck your Roadmap section for a personalized AI-generated path based on your role track!";

  if (q.includes('binary search'))
    return "**Binary Search** — O(log n) search on sorted arrays.\n\n```\nlo, hi = 0, n-1\nwhile lo <= hi:\n  mid = (lo+hi)//2\n  if arr[mid] == target: return mid\n  elif arr[mid] < target: lo = mid+1\n  else: hi = mid-1\n```\n\n**Extended:** Rotated arrays, search insert position, find peak.";

  return "I can help with:\n\n- 📚 **DSA** — algorithms, data structures, complexity\n- 🗺️ **Roadmap** — what to learn next\n- 🎤 **Interview prep** — technical and HR\n- 💡 **Weak topic improvement**\n\nWhat would you like to work on?";
}

module.exports = { chat };
