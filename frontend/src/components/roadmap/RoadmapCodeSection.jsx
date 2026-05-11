import React, { memo, useState } from 'react';
import { Code2, Copy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * RoadmapCodeSection
 * Renders examples and code snippets for a module.
 * Uses lightweight <pre><code> blocks with neon styling.
 * Memoized — does not re-render unless props change.
 */
const RoadmapCodeSection = memo(({ examples, codeSnippets }) => {
  const hasExamples = Array.isArray(examples) && examples.length > 0;
  const hasCode = Array.isArray(codeSnippets) && codeSnippets.length > 0;

  if (!hasExamples && !hasCode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="space-y-3"
    >
      {/* Examples */}
      {hasExamples && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1 h-3 bg-secondary rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Real Examples</span>
          </div>
          {examples.map((ex, i) => (
            <div key={i} className="p-3 bg-secondary/5 border border-secondary/15 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-wider text-secondary/80 mb-1">{ex.title}</p>
              <p className="text-[11px] text-white/70 leading-relaxed">{ex.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Code Snippets */}
      {hasCode && codeSnippets.map((snippet, i) => (
        <CodeBlock key={i} snippet={snippet} />
      ))}
    </motion.div>
  );
});

// ─── Individual code block with copy button ──────────────────────

const CodeBlock = memo(({ snippet }) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-black/30">
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-white/5 cursor-pointer"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
            {snippet.label || snippet.language || 'Code'}
          </span>
          {snippet.language && (
            <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[9px] font-bold text-primary uppercase">
              {snippet.language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); handleCopy(); }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
            title="Copy code"
          >
            {copied
              ? <Check className="w-3 h-3 text-green-400" />
              : <Copy className="w-3 h-3 text-muted" />
            }
          </button>
          <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Code content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-cyan-300/90">
              <code>{snippet.code}</code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

RoadmapCodeSection.displayName = 'RoadmapCodeSection';
CodeBlock.displayName = 'CodeBlock';
export default RoadmapCodeSection;
