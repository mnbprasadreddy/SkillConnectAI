import React, { memo } from 'react';
import { AlertTriangle, Mic, Dumbbell, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * RoadmapExerciseSection
 * Renders best practices, common mistakes, interview tips,
 * mini exercises, and practice problems for a module.
 * Memoized for performance.
 */
const RoadmapExerciseSection = memo(({
  bestPractices,
  commonMistakes,
  interviewTips,
  miniExercises,
  practiceProblems,
}) => {
  const hasBest      = Array.isArray(bestPractices)    && bestPractices.length > 0;
  const hasMistakes  = Array.isArray(commonMistakes)   && commonMistakes.length > 0;
  const hasInterview = Array.isArray(interviewTips)    && interviewTips.length > 0;
  const hasExercises = Array.isArray(miniExercises)    && miniExercises.length > 0;
  const hasProblems  = Array.isArray(practiceProblems) && practiceProblems.length > 0;

  if (!hasBest && !hasMistakes && !hasInterview && !hasExercises && !hasProblems) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="space-y-3"
    >
      {/* Best Practices & Common Mistakes — side by side */}
      {(hasBest || hasMistakes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hasBest && (
            <BulletCard
              label="Best Practices"
              items={bestPractices}
              color="green"
              icon={<span className="text-green-400">✓</span>}
            />
          )}
          {hasMistakes && (
            <BulletCard
              label="Common Mistakes"
              items={commonMistakes}
              color="red"
              icon={<AlertTriangle className="w-3 h-3 text-red-400" />}
            />
          )}
        </div>
      )}

      {/* Interview Tips */}
      {hasInterview && (
        <div className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Mic className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Interview Insights</span>
          </div>
          <ul className="space-y-1.5">
            {interviewTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-white/70">
                <span className="text-purple-400 mt-0.5 flex-shrink-0">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mini Exercises */}
      {hasExercises && (
        <div className="p-4 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Mini Exercises</span>
          </div>
          <ul className="space-y-1.5">
            {miniExercises.map((ex, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-white/70">
                <span className="text-primary mt-0.5 font-black flex-shrink-0">{i + 1}.</span>
                {ex}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Practice Problems */}
      {hasProblems && (
        <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Practice Problems</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {practiceProblems.map((problem, i) => (
              <span key={i}
                className="px-3 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[10px] font-bold text-amber-300/80"
              >
                {problem}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});

// ─── Reusable bullet list card ───────────────────────────────────

const colorMap = {
  green: { bg: 'bg-green-500/5', border: 'border-green-500/15', text: 'text-green-400' },
  red:   { bg: 'bg-red-500/5',   border: 'border-red-500/15',   text: 'text-red-400'   },
};

const BulletCard = memo(({ label, items, color, icon }) => {
  const c = colorMap[color] || colorMap.green;
  return (
    <div className={`p-4 ${c.bg} border ${c.border} rounded-xl`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className={`text-[10px] font-black uppercase tracking-widest ${c.text}`}>{label}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className={`flex items-start gap-2 text-[11px] text-white/70`}>
            <span className={`${c.text} mt-0.5 flex-shrink-0`}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
});

RoadmapExerciseSection.displayName = 'RoadmapExerciseSection';
BulletCard.displayName = 'BulletCard';
export default RoadmapExerciseSection;
