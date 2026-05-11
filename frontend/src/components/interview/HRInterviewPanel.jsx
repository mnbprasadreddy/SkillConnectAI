/**
 * HRInterviewPanel — HR / Behavioral verbal interview panel.
 * Shows AI avatar + animated question + live transcript feed.
 * Transcript rendering is capped and null-safe.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, MessageSquare, ChevronRight, Mic } from 'lucide-react';

const HRInterviewPanel = ({
  questions = [],
  currentIndex,
  onNext,
  onPrev,
  transcript = [],
  currentPartial = '',
  formatTime,
  timeLeft,
  tone = 'professional',
  isSpeaking = false,
}) => {
  const current     = questions[currentIndex];
  const questionText = typeof current === 'object' ? current?.question : current;
  const toneColors  = { friendly: 'text-green-400', professional: 'text-primary', aggressive: 'text-red-400' };
  const toneLabel   = { friendly: 'Friendly Mode', professional: 'Professional', aggressive: 'High Pressure' };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      {/* AI Avatar + Question */}
      <div className="flex-1 glass-card relative flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

        {/* Tone badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest ${toneColors[tone]}`}>
          {toneLabel[tone]}
        </div>

        {/* Pulsing AI orb */}
        <div className="relative mb-8">
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="w-44 h-44 rounded-full border border-primary/20 flex items-center justify-center"
          >
            <div className="w-28 h-28 rounded-full border border-primary/40 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 blur-2xl animate-pulse" />
            </div>
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 -m-3 border-t-2 border-primary/10 rounded-full"
          />
          <BrainCircuit className="w-12 h-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-neon-cyan" />
        </div>

        {/* Question */}
        <div className="text-center max-w-xl px-10 space-y-4">
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/50">Neural Inquiry {currentIndex + 1}/{questions.length}</span>
          <AnimatePresence mode="wait">
            <motion.h2
              key={currentIndex}
              initial={{ opacity: 0, filter: 'blur(8px)', y: 15 }}
              animate={{ opacity: 1, filter: 'blur(0)',   y: 0  }}
              exit={{   opacity: 0, filter: 'blur(8px)', y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-bold leading-relaxed text-white"
            >
              "{questionText || 'Preparing next question...'}"
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* Next button */}
        {isSpeaking && (
          <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Speaking — finish your answer</span>
          </div>
        )}
        <button
          onClick={onNext}
          disabled={isSpeaking}
          className="absolute bottom-6 right-6 flex items-center gap-2 px-5 py-2.5 bg-primary text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-neon-cyan transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {currentIndex >= questions.length - 1 ? 'End Session' : 'Next Question'}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Transcript */}
      <div className="h-44 glass-card p-4 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-muted">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Live Transcription</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-primary font-mono">
            <Mic className="w-3 h-3 animate-pulse" />
            {formatTime ? formatTime(timeLeft) : '00:00'}
          </div>
        </div>
        <div className="space-y-3">
          {/* Cap transcript display at last 30 entries for performance */}
          {transcript.slice(-30).map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-xs font-medium leading-relaxed border-l-2 pl-3 py-0.5 ${
                line?.startsWith?.('[AI]') ? 'border-secondary/40 text-secondary' : 'border-primary/40 text-white/90'
              }`}
            >
              {line?.replace?.(/^\[(AI|Candidate)\] /, '') ?? line}
            </motion.p>
          ))}
          {currentPartial && (
            <p className="text-xs text-white/60 italic border-l-2 border-primary/20 pl-3 animate-pulse">
              {currentPartial}
            </p>
          )}
          {transcript.length === 0 && !currentPartial && (
            <p className="text-muted/40 italic text-xs text-center py-4">Awaiting vocal input...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(HRInterviewPanel);
