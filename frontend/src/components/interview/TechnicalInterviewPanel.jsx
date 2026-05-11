/**
 * TechnicalInterviewPanel — Role-based technical interview panel.
 * Same structure as HR but with role/concept badges and technical context.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, MessageSquare, ChevronRight, Mic, Server } from 'lucide-react';

const TechnicalInterviewPanel = ({
  questions = [],
  currentIndex,
  onNext,
  onPrev,
  transcript = [],
  currentPartial = '',
  formatTime,
  timeLeft,
  role = 'General',
  difficulty = 'Intermediate',
  isSpeaking = false,
}) => {
  const current      = questions[currentIndex];
  const questionText = typeof current === 'object' ? current?.question : current;
  const topic        = typeof current === 'object' ? current?.topic    : null;

  const roleColors = {
    Frontend: 'text-cyan-400', Backend: 'text-purple-400', 'Full Stack': 'text-green-400',
    DevOps: 'text-orange-400', 'AI/ML': 'text-pink-400', Cybersecurity: 'text-red-400',
    Cloud: 'text-blue-400', 'Data Science': 'text-yellow-400',
  };
  const roleColor = roleColors[role] || 'text-primary';

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      {/* Main question area */}
      <div className="flex-1 glass-card relative flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/5 to-transparent pointer-events-none" />

        {/* Role + difficulty badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={`px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest ${roleColor}`}>
            <Server className="w-2.5 h-2.5 inline mr-1" />{role}
          </span>
          <span className="px-2.5 py-1 bg-secondary/10 border border-secondary/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-secondary">
            {difficulty}
          </span>
          {topic && (
            <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted">
              {topic}
            </span>
          )}
        </div>

        {/* AI orb */}
        <div className="relative mb-8">
          <motion.div
            animate={{ scale: [1, 1.06, 1], rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-40 h-40 rounded-full border border-secondary/20 flex items-center justify-center"
          >
            <div className="w-24 h-24 rounded-full border border-secondary/40 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-secondary/20 blur-2xl animate-pulse" />
            </div>
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 -m-3 border-t-2 border-secondary/10 rounded-full"
          />
          <BrainCircuit className="w-10 h-10 text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Question text */}
        <div className="text-center max-w-xl px-10 space-y-4">
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-secondary/50">
            Technical Q {currentIndex + 1} / {questions.length}
          </span>
          <AnimatePresence mode="wait">
            <motion.h2
              key={currentIndex}
              initial={{ opacity: 0, filter: 'blur(8px)', y: 15 }}
              animate={{ opacity: 1, filter: 'blur(0)',   y: 0  }}
              exit={{   opacity: 0, filter: 'blur(8px)', y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-bold leading-relaxed text-white"
            >
              "{questionText || 'Loading question...'}"
            </motion.h2>
          </AnimatePresence>
        </div>

        {isSpeaking && (
          <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Speaking — finish your answer</span>
          </div>
        )}
        <button
          onClick={onNext}
          disabled={isSpeaking}
          className="absolute bottom-6 right-6 flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-neon-purple transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {currentIndex >= questions.length - 1 ? 'Finish' : 'Next'}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Transcript */}
      <div className="h-44 glass-card p-4 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-muted">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Live Transcript</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-secondary font-mono">
            <Mic className="w-3 h-3 animate-pulse" />
            {formatTime ? formatTime(timeLeft) : '00:00'}
          </div>
        </div>
        <div className="space-y-3">
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
            <p className="text-xs text-white/60 italic border-l-2 border-secondary/20 pl-3 animate-pulse">
              {currentPartial}
            </p>
          )}
          {transcript.length === 0 && !currentPartial && (
            <p className="text-muted/40 italic text-xs text-center py-4">Speak to begin transcription...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TechnicalInterviewPanel);
