import React, { memo } from 'react';
import { Brain, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * RoadmapTheorySection
 * Displays the concise theory overview and when-to-use bullet points for a module.
 * Memoized — does not re-render unless the `theory` prop changes.
 */
const RoadmapTheorySection = memo(({ theory }) => {
  if (!theory) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-3"
    >
      {/* Overview */}
      {theory.overview && (
        <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Theory Overview</span>
          </div>
          <p className="text-[12px] text-white/80 leading-relaxed">{theory.overview}</p>
        </div>
      )}

      {/* When to use */}
      {Array.isArray(theory.whenToUse) && theory.whenToUse.length > 0 && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">When To Use</span>
          </div>
          <ul className="space-y-1.5">
            {theory.whenToUse.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-white/70">
                <span className="text-amber-400 mt-0.5 flex-shrink-0">▸</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
});

RoadmapTheorySection.displayName = 'RoadmapTheorySection';
export default RoadmapTheorySection;
