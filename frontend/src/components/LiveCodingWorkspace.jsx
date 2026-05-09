import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, Lightbulb, Loader2, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const LANGUAGE_MAP = {
  javascript: { id: 63, name: 'JavaScript (Node.js)' },
  python: { id: 71, name: 'Python (3.8.1)' },
  cpp: { id: 54, name: 'C++ (GCC 9.2.0)' },
  java: { id: 62, name: 'Java (OpenJDK 13.0.1)' }
};

const DEFAULT_CODE = {
  javascript: 'function solve() {\n  // Write your code here\n}\n\nconsole.log(solve());',
  python: 'def solve():\n    # Write your code here\n    pass\n\nprint(solve())',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}'
};

const LiveCodingWorkspace = ({ interviewId, currentQuestion, onScoreUpdate, onNextQuestion }) => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_CODE['javascript']);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [aiHint, setAiHint] = useState(null);
  
  const editorRef = useRef(null);

  // Dispose Monaco model on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) model.dispose();
        editorRef.current = null;
        console.log('[Monaco] Editor model disposed');
      }
    };
  }, []);

  // Update default code when language changes
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (editorRef.current) {
      const currentVal = editorRef.current.getValue();
      // Only replace if it's still the default code of the previous language
      if (Object.values(DEFAULT_CODE).includes(currentVal.trim())) {
        setCode(DEFAULT_CODE[lang]);
      }
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const logToConsole = (type, message) => {
    setConsoleOutput(prev => {
      // Cap at 100 entries to prevent unbounded memory growth
      const next = [...prev, { type, message, time: new Date().toLocaleTimeString() }];
      return next.length > 100 ? next.slice(-100) : next;
    });
  };

  const handleRun = async () => {
    if (!code.trim() || isExecuting) return;
    setIsExecuting(true);
    logToConsole('info', 'Compiling and executing...');
    setAiHint(null); // Clear previous hints on run

    try {
      const response = await api.post(`/interviews/${interviewId}/execute`, {
        language,
        sourceCode: code,
        stdin: ''
      });

      const { success, data } = response.data;
      
      if (success) {
        if (data.stderr || data.compileOutput) {
          logToConsole('error', data.stderr || data.compileOutput);
        } else {
          logToConsole('success', data.stdout || 'Execution complete with no output.');
        }
        logToConsole('info', `Runtime: ${data.runtime} | Memory: ${data.memory}`);
        
        // Optimistic scoring update based on successful execution
        if (data.status === 'accepted') {
          onScoreUpdate(prev => Math.min(prev + 10, 100));
        } else {
          onScoreUpdate(prev => Math.max(prev - 5, 0));
        }
      } else {
        logToConsole('error', data.stderr || 'Execution failed.');
      }
    } catch (err) {
      logToConsole('error', 'Execution Service Offline or Timeout.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGetHint = async () => {
    if (!code.trim() || isHinting) return;
    setIsHinting(true);
    
    try {
      const questionDesc = typeof currentQuestion === 'object' ? currentQuestion.question : currentQuestion;
      const response = await api.post(`/interviews/${interviewId}/hint`, {
        language,
        sourceCode: code,
        questionDesc
      });
      
      if (response.data) {
        setAiHint(response.data);
      }
    } catch (err) {
      console.error(err);
      setAiHint({ hint: 'Analysis unavailable right now. Focus on basic complexity optimizations.', timeComplexity: 'N/A', spaceComplexity: 'N/A' });
    } finally {
      setIsHinting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] border border-white/5 rounded-2xl overflow-hidden relative glass-card">
      {/* Header Controls */}
      <div className="h-14 bg-[#252526] flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex space-x-1 bg-black/40 p-1 rounded-lg">
            {Object.keys(LANGUAGE_MAP).map(lang => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  language === lang 
                    ? 'bg-primary text-background shadow-neon-cyan' 
                    : 'text-white/50 hover:text-white/90 hover:bg-white/5'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGetHint}
            disabled={isHinting}
            className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary hover:bg-secondary/20 hover:shadow-neon-purple rounded-lg text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isHinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
            Analyze
          </button>
          
          <button
            onClick={handleRun}
            disabled={isExecuting}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-background hover:shadow-neon-cyan rounded-lg text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Execute
          </button>
          <button
            onClick={onNextQuestion}
            className="flex items-center gap-2 px-4 py-1.5 bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Problem Description Bar */}
      <div className="bg-[#1e1e1e] p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white/90">
            {currentQuestion?.question || currentQuestion || "Awaiting problem description..."}
          </h3>
          <div className="flex gap-2 mt-2">
            {currentQuestion?.topic && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] uppercase font-bold rounded">
                {currentQuestion.topic}
              </span>
            )}
            {currentQuestion?.difficulty && (
              <span className="px-2 py-0.5 bg-white/5 text-muted text-[10px] uppercase font-bold rounded">
                {currentQuestion.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor & Console Split */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-[50%]">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: '"Fira Code", monospace',
              scrollBeyondLastLine: false,
              roundedSelection: false,
              padding: { top: 16 },
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: true,
              smoothScrolling: true,
              contextmenu: false // Disable right click to prevent cheating attempts
            }}
          />
        </div>

        {/* Output Console */}
        <div className="h-64 bg-[#1e1e1e] border-t border-white/5 flex flex-col">
          <div className="h-8 bg-[#252526] flex items-center px-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Execution Stream</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2">
            {consoleOutput.length === 0 && !aiHint && (
              <div className="text-white/30 italic text-xs">Waiting for execution stream...</div>
            )}

            <AnimatePresence>
              {consoleOutput.map((log, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-3 p-2 rounded bg-black/20 ${
                    log.type === 'error' ? 'text-red-400 border-l-2 border-red-500' :
                    log.type === 'success' ? 'text-green-400 border-l-2 border-green-500' :
                    'text-white/80 border-l-2 border-primary/50'
                  }`}
                >
                  <span className="text-[10px] opacity-40 mt-1 shrink-0">{log.time}</span>
                  <pre className="whitespace-pre-wrap break-words flex-1 font-mono text-xs">{log.message}</pre>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* AI Hint Panel */}
            <AnimatePresence>
              {aiHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-4 rounded-xl border border-secondary/30 bg-secondary/5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-secondary shadow-neon-purple" />
                    <span className="text-xs font-black uppercase tracking-widest text-secondary">Neural Analysis</span>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed mb-4">{aiHint.hint}</p>
                  
                  <div className="flex gap-4 text-xs font-mono">
                    <div className="px-2 py-1 bg-black/40 rounded text-primary border border-primary/20">Time: {aiHint.timeComplexity}</div>
                    <div className="px-2 py-1 bg-black/40 rounded text-green-400 border border-green-400/20">Space: {aiHint.spaceComplexity}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCodingWorkspace;
