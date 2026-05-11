import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';

// Lazy-load the popup — only loaded when the user first opens it
const AICoachPopup = lazy(() => import('./AICoachPopup'));

/**
 * AICoachButton
 * Globally mounted floating button — fixed bottom-right.
 * Lazy-mounts AICoachPopup on first click.
 */
const AICoachButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Tooltip label — visible on hover */}
        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="px-3 py-1.5 bg-[#0a0f1a]/90 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary backdrop-blur-md pointer-events-none"
            >
              AI Coach
            </motion.div>
          )}
        </AnimatePresence>

        {/* The button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(v => !v)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(139,92,246,0.2))',
            border: '1px solid rgba(0,212,255,0.4)',
            boxShadow: '0 0 20px rgba(0,212,255,0.25), 0 0 40px rgba(0,212,255,0.1)',
          }}
          aria-label="Open AI Coach"
        >
          {/* Pulse ring */}
          {!open && (
            <span className="absolute inset-0 rounded-full animate-ping"
              style={{ background: 'rgba(0,212,255,0.15)', animationDuration: '2s' }} />
          )}

          {/* Icon */}
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="close"
                initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-5 h-5 text-primary" />
              </motion.div>
            ) : (
              <motion.div key="open"
                initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Bot className="w-6 h-6 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Popup — lazy mounted */}
      <AnimatePresence>
        {open && (
          <Suspense fallback={null}>
            <AICoachPopup onClose={() => setOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
};

export default AICoachButton;
