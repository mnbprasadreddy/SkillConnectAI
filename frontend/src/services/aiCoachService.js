// ═══════════════════════════════════════════════════════════════
// SkillConnect AI Coach — Frontend Service
// Wraps API calls — isolated from other services.
// ═══════════════════════════════════════════════════════════════

import api from './api';

/**
 * Send a message to the AI Coach.
 * @param {string} message - User's message
 * @param {Array}  history - Last N messages [{role, content}]
 * @returns {string} AI reply text
 */
export async function sendMessage(message, history = []) {
  const res = await api.post('/ai-coach/chat', { message, history });

  // api.js interceptor returns the whole { success, data, message } envelope.
  // The backend puts the reply inside data.reply.
  const reply = res?.data?.reply;

  if (!reply || typeof reply !== 'string' || !reply.trim()) {
    console.warn('[AICoach] Unexpected response shape:', JSON.stringify(res)?.slice(0, 200));
    return "I received an unexpected response. Please try again!";
  }

  return reply;
}

/**
 * Fetch the current user's lightweight context snapshot.
 * @returns {Object} context summary
 */
export async function getContext() {
  try {
    const res = await api.get('/ai-coach/context');
    return res?.data || {};
  } catch (err) {
    console.warn('[AICoach] Context fetch failed:', err.message);
    return {};
  }
}
