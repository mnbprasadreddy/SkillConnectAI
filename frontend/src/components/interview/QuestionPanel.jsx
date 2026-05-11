/**
 * QuestionPanel — Animated question carousel for all interview types.
 * Prev/next navigation, topic/difficulty badges, expected-points collapsible.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Tag, Lightbulb, ChevronDown } from 'lucide-react';

const QuestionPanel = ({ questions = [], currentIndex, onNext, onPrev, interviewType }) => {
  const [showHints, setShowHints] = useState(false);

  const current = questions[currentIndex];
  if (!current) return (
    <div className="flex-1 flex items-center justify-center text-muted text-sm">
      Loading questions...
    </div>
  );

  const questionText  = typeof current === 'object' ? current.question    : current;
  const topic         = typeof current === 'object' ? current.topic        : null;
  const difficulty    = typeof current === 'object' ? current.difficulty   : null;
  const expectedPts   = typeof current === 'object' ? current.expectedPoints : [];

  const typeLabel = { coding: 'Algorithm Challenge', behavioral: 'Behavioral', hr: 'HR', technical: 'Technical' }[interviewType] || 'Question';

  return (
    <div className="flex-1 glass-card relative flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60">{typeLabel}</span>
          {topic && (
            <span className="px-2.5 py-0.5 bg-secondary/10 border border-secondary/20 rounded-lg text-[9px] font-black uppercase text-secondary tracking-widest">
              {topic}
            </span>
          )}
          {difficulty && (
            <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-muted tracking-widest">
              {difficulty}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted font-mono">{currentIndex + 1} / {questions.length}</span>
      </div>

      {/* Question text */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
            exit={{   opacity: 0, y: -20, filter: 'blur(8px)' }}
            transition={{ duration: 0.35 }}
            className="text-center max-w-2xl"
          >
            <h2 className="text-2xl font-bold tracking-tight leading-relaxed text-white">
              "{questionText}"
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Expected points (collapsible) */}
        {expectedPts?.length > 0 && (
          <div className="mt-6 w-full max-w-lg">
            <button
              onClick={() => setShowHints(v => !v)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors mx-auto"
            >
              <Lightbulb className="w-3 h-3" />
              Key Points
              <ChevronDown className={`w-3 h-3 transition-transform ${showHints ? 'rotate-180' : ''}`} />
            </button>
            {showHints && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-1.5 overflow-hidden"
              >
                {expectedPts.map((pt, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted">
                    <div className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
                    {pt}
                  </li>
                ))}
              </motion.ul>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 pb-6">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-neon-cyan transition-all group"
        >
          {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default QuestionPanel;
