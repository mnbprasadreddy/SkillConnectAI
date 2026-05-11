/**
 * LiveCodingPanel — Isolated Monaco + Judge0 coding workspace.
 *
 * React.memo + fully isolated local state — never causes parent rerenders.
 * Reuses existing Problems DB questions + /interviews/:id/execute endpoint.
 * Monaco models cleaned up on unmount.
 * Graceful fallback if Judge0 fails.
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Zap, ChevronRight, CheckCircle, XCircle, Clock, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const LANG_MAP = {
  javascript: { id: 63, label: 'JavaScript', monacoLang: 'javascript', starter: '// Write your solution\nfunction solution() {\n  \n}\n' },
  python:     { id: 71, label: 'Python',     monacoLang: 'python',     starter: '# Write your solution\ndef solution():\n    pass\n' },
  java:       { id: 62, label: 'Java',       monacoLang: 'java',       starter: 'class Solution {\n    public void solve() {\n        \n    }\n}\n' },
  cpp:        { id: 54, label: 'C++',        monacoLang: 'cpp',        starter: '#include<bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n' },
};

const LiveCodingPanel = memo(({
  interviewId,
  currentQuestion,
  selectedLanguage = 'python',
  onScoreUpdate,
  onNextQuestion,
  questionIndex,
  totalQuestions,
}) => {
  const [code, setCode]         = useState(LANG_MAP[selectedLanguage]?.starter || '');
  const [output, setOutput]     = useState(null);
  const [running, setRunning]   = useState(false);
  const [tab, setTab]           = useState('output'); // 'output' | 'testcase'
  const editorRef               = useRef(null);

  const questionText = currentQuestion
    ? (typeof currentQuestion === 'object' ? currentQuestion.question : currentQuestion)
    : 'Loading question...';

  // Update starter code when language changes — isolated, no parent rerender
  const handleLanguageChange = useCallback((lang) => {
    setCode(LANG_MAP[lang]?.starter || '');
    setOutput(null);
  }, []);

  // Monaco cleanup on unmount (constraint: cleanup Monaco models)
  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
  }, []);

  useEffect(() => {
    return () => {
      // Dispose all Monaco models to prevent memory leaks between sessions
      try {
        if (window.monaco) {
          window.monaco.editor.getModels().forEach(m => m.dispose());
        }
      } catch { /* silent */ }
    };
  }, []);

  // Run code via interview execution endpoint (constraint: isolated wrapper)
  const handleRun = useCallback(async () => {
    if (running || !code.trim()) return;
    setRunning(true);
    setOutput(null);
    setTab('output');

    try {
      const langConfig = LANG_MAP[selectedLanguage] || LANG_MAP.python;
      const res = await api.post(`/interviews/${interviewId}/execute`, {
        language:   selectedLanguage,
        sourceCode: code,
        stdin:      '',
      });

      const result = res?.data;
      const stdout  = result?.stdout  || '';
      const stderr  = result?.stderr  || result?.compile_output || '';
      const status  = result?.status?.description || 'Unknown';
      const time    = result?.time    || null;
      const memory  = result?.memory  || null;
      const accepted = status === 'Accepted';

      setOutput({ stdout, stderr, status, time, memory, accepted });

      // Update parent score (memoised callback — no rerender cascade)
      if (onScoreUpdate) {
        const codeScore = accepted ? 85 : Math.max(30, 60 - (stderr ? 20 : 0));
        onScoreUpdate(codeScore);
      }
    } catch (err) {
      console.warn('[LiveCodingPanel] Execution failed:', err.message);
      setOutput({
        stdout:   '',
        stderr:   'Code execution service unavailable. Please try again.',
        status:   'Error',
        accepted: false,
      });
    } finally {
      setRunning(false);
    }
  }, [code, selectedLanguage, interviewId, running, onScoreUpdate]);

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
      {/* Question banner */}
      <div className="glass-card px-5 py-3 flex items-center justify-between border border-primary/10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 shrink-0">
            Q{questionIndex + 1}/{totalQuestions}
          </span>
          <p className="text-sm font-bold text-white truncate">{questionText}</p>
          {currentQuestion?.difficulty && (
            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] uppercase font-black text-muted tracking-widest shrink-0">
              {currentQuestion.difficulty}
            </span>
          )}
        </div>
        <button
          onClick={onNextQuestion}
          className="flex items-center gap-1.5 ml-4 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 transition-all shrink-0"
        >
          Next <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Editor + output */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden rounded-2xl border border-white/5">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/2">
          <div className="flex gap-1">
            {Object.entries(LANG_MAP).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => handleLanguageChange(key)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedLanguage === key
                    ? 'bg-primary/20 border border-primary/30 text-primary'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
          >
            {running
              ? <><Zap className="w-3.5 h-3.5 animate-pulse" /> Running...</>
              : <><Play className="w-3.5 h-3.5" /> Run Code</>
            }
          </button>
        </div>

        {/* Monaco editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={LANG_MAP[selectedLanguage]?.monacoLang || 'python'}
            value={code}
            onChange={v => setCode(v || '')}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize:          13,
              fontFamily:        'JetBrains Mono, Fira Code, monospace',
              minimap:           { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers:       'on',
              folding:           false,
              wordWrap:          'on',
              automaticLayout:   true,
              padding:           { top: 12, bottom: 12 },
            }}
          />
        </div>

        {/* Output panel */}
        <div className="h-36 border-t border-white/5 flex flex-col">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5">
            {['output', 'testcase'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${tab === t ? 'text-primary' : 'text-muted hover:text-white'}`}
              >
                {t}
              </button>
            ))}
            {output && (
              <div className={`ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase ${output.accepted ? 'text-green-400' : 'text-red-400'}`}>
                {output.accepted ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {output.status}
                {output.time   && <span className="text-muted ml-2 flex items-center gap-1"><Clock className="w-3 h-3" />{output.time}s</span>}
                {output.memory && <span className="text-muted flex items-center gap-1"><Cpu className="w-3 h-3" />{output.memory}KB</span>}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
            <AnimatePresence mode="wait">
              {running ? (
                <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-muted">
                  <Zap className="w-3.5 h-3.5 animate-pulse text-primary" /> Executing...
                </motion.div>
              ) : output ? (
                <motion.div key="output" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {output.stdout && <pre className="text-green-400 whitespace-pre-wrap">{output.stdout}</pre>}
                  {output.stderr && <pre className="text-red-400 whitespace-pre-wrap">{output.stderr}</pre>}
                  {!output.stdout && !output.stderr && <p className="text-muted">No output</p>}
                </motion.div>
              ) : (
                <motion.p key="idle" className="text-muted/50 italic">
                  Run your code to see output here...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

LiveCodingPanel.displayName = 'LiveCodingPanel';
export default LiveCodingPanel;
