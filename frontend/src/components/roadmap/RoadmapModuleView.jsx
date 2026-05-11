import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, RefreshCw, Brain, Target, Lightbulb,
} from 'lucide-react';
import RoadmapTheorySection from './RoadmapTheorySection';
import RoadmapCodeSection from './RoadmapCodeSection';
import RoadmapExerciseSection from './RoadmapExerciseSection';

/**
 * RoadmapModuleView
 * Container for a single expanded module's full content.
 *
 * Renders content lazily — child sections only mount when expanded.
 * Tabs allow switching between Theory, Code, and Exercises.
 * Memoized to avoid re-renders when other modules change.
 */

const TABS = ['Theory', 'Code & Examples', 'Exercises'];

const RoadmapModuleView = memo(({ mod, completing, onComplete }) => {
  const [activeTab, setActiveTab] = useState('Theory');

  const hasTheory      = !!mod.theory;
  const hasCode        = (Array.isArray(mod.codeSnippets)  && mod.codeSnippets.length  > 0) ||
                         (Array.isArray(mod.examples)       && mod.examples.length       > 0);
  const hasExercises   = (Array.isArray(mod.bestPractices)    && mod.bestPractices.length    > 0) ||
                         (Array.isArray(mod.commonMistakes)   && mod.commonMistakes.length   > 0) ||
                         (Array.isArray(mod.interviewTips)    && mod.interviewTips.length    > 0) ||
                         (Array.isArray(mod.miniExercises)    && mod.miniExercises.length    > 0) ||
                         (Array.isArray(mod.practiceProblems) && mod.practiceProblems.length > 0);

  // Auto-select a tab that has content
  const effectiveTab = activeTab === 'Theory' && !hasTheory && hasCode
    ? 'Code & Examples'
    : activeTab === 'Code & Examples' && !hasCode && hasExercises
    ? 'Exercises'
    : activeTab;

  return (
    <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
      {/* Module description */}
      {mod.description && (
        <p className="text-xs text-muted leading-relaxed">{mod.description}</p>
      )}

      {/* Legacy concepts / milestones / checkpoints */}
      <LegacyConcepts mod={mod} />

      {/* Tab Navigation */}
      {(hasTheory || hasCode || hasExercises) && (
        <>
          <div className="flex gap-2 border-b border-white/5 pb-3">
            {TABS.map(tab => {
              const active = effectiveTab === tab;
              const hasContent =
                (tab === 'Theory'          && hasTheory)    ||
                (tab === 'Code & Examples' && hasCode)      ||
                (tab === 'Exercises'       && hasExercises);
              if (!hasContent) return null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${
                    active
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-white/5 border-white/10 text-muted hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab Content — conditionally rendered */}
          <AnimatePresence mode="wait">
            {effectiveTab === 'Theory' && hasTheory && (
              <motion.div key="theory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RoadmapTheorySection theory={mod.theory} />
              </motion.div>
            )}
            {effectiveTab === 'Code & Examples' && hasCode && (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RoadmapCodeSection examples={mod.examples} codeSnippets={mod.codeSnippets} />
              </motion.div>
            )}
            {effectiveTab === 'Exercises' && hasExercises && (
              <motion.div key="exercises" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RoadmapExerciseSection
                  bestPractices={mod.bestPractices}
                  commonMistakes={mod.commonMistakes}
                  interviewTips={mod.interviewTips}
                  miniExercises={mod.miniExercises}
                  practiceProblems={mod.practiceProblems}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Complete / Completed status */}
      {!mod.isCompleted ? (
        <button
          onClick={() => onComplete(mod.id)}
          disabled={completing === mod.id}
          className="neon-button-cyan w-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
        >
          {completing === mod.id
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
            : <><CheckCircle2 className="w-4 h-4" /> Mark as Completed</>
          }
        </button>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
            Module Completed
            {mod.completedAt && ` — ${new Date(mod.completedAt).toLocaleDateString()}`}
          </span>
        </div>
      )}
    </div>
  );
});

// ─── Legacy concepts / milestones / checkpoints display ──────────
// Preserved from original Roadmap.jsx — unchanged behaviour.

const LegacyConcepts = memo(({ mod }) => (
  <div className="space-y-3">
    {Array.isArray(mod.concepts) && mod.concepts.length > 0 && (
      <div>
        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
          <Brain className="w-3 h-3" /> Key Concepts
        </h5>
        <div className="flex flex-wrap gap-2">
          {mod.concepts.map((c, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-primary/5 border border-primary/10 rounded-lg text-[10px] font-bold">
              {c}
            </span>
          ))}
        </div>
      </div>
    )}

    {Array.isArray(mod.milestones) && mod.milestones.length > 0 && (
      <div>
        <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
          <Target className="w-3 h-3" /> Milestones
        </h5>
        <ul className="space-y-1">
          {mod.milestones.map((m, idx) => (
            <li key={idx} className="text-[11px] text-muted flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">▸</span> {m}
            </li>
          ))}
        </ul>
      </div>
    )}

    {Array.isArray(mod.checkpoints) && mod.checkpoints.length > 0 && (
      <div>
        <h5 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2 flex items-center gap-1.5">
          <Lightbulb className="w-3 h-3" /> Knowledge Checkpoints
        </h5>
        <ul className="space-y-1">
          {mod.checkpoints.map((cp, idx) => (
            <li key={idx} className="text-[11px] text-muted flex items-start gap-2">
              <span className="text-secondary mt-0.5">?</span> {cp}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
));

RoadmapModuleView.displayName = 'RoadmapModuleView';
LegacyConcepts.displayName = 'LegacyConcepts';
export default RoadmapModuleView;
