import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, Zap } from 'lucide-react';
import { sendMessage } from '../../services/aiCoachService';
import ChatMessage from './ChatMessage';

const MAX_HISTORY = 10;

const QUICK_SUGGESTIONS = [
  "What should I learn after Arrays?",
  "Explain Sliding Window technique",
  "Give me a React interview question",
  "Why is Dynamic Programming hard?",
  "Suggest a backend learning roadmap",
  "How do I improve my weak topics?",
];

const WELCOME_MESSAGE = {
  role:    'assistant',
  content: "👋 Hi! I'm **SkillConnect AI Coach**.\n\nI can help you with:\n- 📚 DSA explanations & algorithms\n- 🗺️ Roadmap & learning guidance\n- 🎤 Interview prep (technical + HR)\n- 💡 Weak topic recommendations\n\nWhat would you like to work on today?",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

/**
 * AICoachPopup
 * The main chat popup for the SkillConnect AI Coach.
 * Local state only — no DB persistence in Phase 1.
 */
const AICoachPopup = ({ onClose }) => {
  const [messages, setMessages]       = useState([WELCOME_MESSAGE]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatEndRef  = useRef(null);
  const inputRef    = useRef(null);
  const popupRef    = useRef(null);

  // ─── Scroll to bottom on new messages ──────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ─── ESC to close ───────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ─── Click outside to close ────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    // Delayed to avoid closing immediately on button click
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 100);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handleClick); };
  }, [onClose]);

  // ─── Focus input on open ────────────────────────────────────────
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ─── Send message ───────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setShowSuggestions(false);
    setLoading(true);

    const userMsg = {
      role:    'user',
      content: msg,
      time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => {
      const updated = [...prev, userMsg];
      // Keep only last MAX_HISTORY messages
      return updated.slice(-MAX_HISTORY);
    });

    try {
      // Build history for backend (role + content only)
      const historyForApi = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

      const reply = await sendMessage(msg, historyForApi);

      const aiMsg = {
        role:    'assistant',
        content: reply,
        time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg].slice(-MAX_HISTORY));
    } catch (err) {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment! 🔄",
        time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }].slice(-MAX_HISTORY));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages]);

  // ─── Enter to send (Shift+Enter for newline) ─────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      exit={{   opacity: 0, scale: 0.92, y: 20  }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[580px] flex flex-col"
      style={{ maxWidth: 'calc(100vw - 24px)' }}
    >
      {/* Glass container */}
      <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-[#0a0f1a]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
           style={{ boxShadow: '0 0 40px rgba(0,212,255,0.08), 0 25px 50px rgba(0,0,0,0.5)' }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0a0f1a] animate-pulse" />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-wider text-white">AI Coach</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-green-400">Online</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-muted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Chat area ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
             style={{ maxHeight: '360px', minHeight: '200px' }}>
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex gap-2.5 items-center"
            >
              <div className="w-7 h-7 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-secondary" />
              </div>
              <div className="px-3.5 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1 items-center h-3">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      className="w-1.5 h-1.5 bg-primary/60 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ── Quick suggestions ─────────────────────────────────── */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-4 pb-2"
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Quick Start
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <button key={i}
                    onClick={() => handleSend(s)}
                    className="px-2.5 py-1 text-[9px] font-bold bg-primary/5 border border-primary/15 rounded-lg text-primary/80 hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input area ───────────────────────────────────────── */}
        <div className="px-4 pb-4 pt-2 border-t border-white/5">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              style={{ resize: 'none', minHeight: '38px', maxHeight: '80px' }}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white placeholder:text-muted/50 outline-none focus:border-primary/40 transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 flex-shrink-0 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center hover:bg-primary/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading
                ? <Zap className="w-4 h-4 text-primary animate-pulse" />
                : <Send className="w-4 h-4 text-primary" />
              }
            </button>
          </div>
          <p className="text-[9px] text-muted/40 mt-1.5 text-center">Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AICoachPopup;
