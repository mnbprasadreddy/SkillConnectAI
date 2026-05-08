import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Send, 
  ChevronLeft, 
  Settings, 
  Terminal, 
  Bug, 
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  BrainCircuit,
  Lock,
  ChevronRight,
  Zap
} from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const CodeEditor = memo(({ language, code, setCode }) => (
  <Editor
    height="100%"
    language={language === 'python3' ? 'python' : language}
    value={code}
    theme="vs-dark"
    onChange={(value) => setCode(value)}
    options={{
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 20 },
      fontFamily: 'Fira Code',
      cursorSmoothCaretAnimation: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      scrollbar: {
        vertical: 'hidden',
        horizontal: 'hidden'
      }
    }}
  />
));

const Workspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python3');
  const [activeTab, setActiveTab] = useState('description');
  const [results, setResults] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [hints, setHints] = useState([]);

  const languages = [
    { id: 'python3', label: 'Python 3', default: 'def solve():\n    # Your logic here\n    pass' },
    { id: 'javascript', label: 'JavaScript', default: 'function solve() {\n    // Your logic here\n}' },
    { id: 'cpp', label: 'C++', default: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your logic here\n    return 0;\n}' },
    { id: 'java', label: 'Java', default: 'public class Solution {\n    public static void main(String[] args) {\n        // Your logic here\n    }\n}' },
  ];

  const handleCodeChange = useCallback((value) => {
    setCode(value);
  }, []);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/problems/${id}`);
        const data = response.data;
        setProblem(data);
        setCode(languages.find(l => l.id === language)?.default || '');
        
        if (data.topic) {
          setHints([
            { id: 1, title: 'Complexity Target', content: `Optimal solution for ${data.topic} usually targets O(N) or O(log N).` },
            { id: 2, title: 'Edge Cases', content: 'Consider empty inputs, negative values, and maximum constraints.' }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch problem', err);
        navigate('/app/problems');
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  const handleRun = async () => {
    try {
      setExecuting(true);
      setResults(null);
      const response = await api.post('/submissions/run', {
        language,
        sourceCode: code,
        input: problem?.testCases?.find(tc => !tc.isHidden)?.input || ''
      });
      setResults({ type: 'run', ...response.data });
      setActiveTab('console');
    } catch (err) {
      console.error('Execution failed', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setExecuting(true);
      setResults(null);
      const response = await api.post('/submissions/submit', {
        problemId: parseInt(id),
        language,
        sourceCode: code
      });
      setResults({ type: 'submit', ...response.data });
      setActiveTab('console');
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center text-primary font-black space-y-6">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
      <span className="animate-pulse tracking-[0.5em] text-xs uppercase">Initializing Neural Workspace</span>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background text-white overflow-hidden">
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-surface/30 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/problems')} className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
            <ChevronLeft className="w-5 h-5 text-muted group-hover:text-white transition-colors" />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <h2 className="font-bold tracking-tight text-sm md:text-base">{problem?.title}</h2>
          <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-lg border ${
            problem?.difficulty === 'Easy' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
            problem?.difficulty === 'Medium' ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' :
            'border-red-500/30 text-red-400 bg-red-500/5'
          }`}>
            {problem?.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:border-primary/50 transition-all cursor-pointer"
          >
            {languages.map(l => <option key={l.id} value={l.id} className="bg-surface">{l.label}</option>)}
          </select>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><Settings className="w-4 h-4 text-muted" /></button>
          <div className="h-4 w-px bg-white/10" />
          <button 
            onClick={handleRun}
            disabled={executing}
            className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-primary" />
            RUN
          </button>
          <button 
            onClick={handleSubmit}
            disabled={executing}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-background rounded-lg text-[10px] font-black tracking-widest hover:shadow-neon-cyan transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            SUBMIT
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 flex flex-col border-r border-white/5 bg-surface/10">
          <div className="flex border-b border-white/5 bg-surface/20">
            {['description', 'console', 'hints'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === tab ? 'text-primary' : 'text-muted hover:text-white'
                }`}
              >
                {tab}
                {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-neon-cyan" />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div 
                  key="desc"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Info className="w-5 h-5 text-primary" /> Overview</h3>
                    <p className="text-muted leading-relaxed text-sm">{problem?.description}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Input Format</h4>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl font-mono text-xs leading-relaxed text-primary/80">
                      {problem?.inputFormat || 'Array of integers nums, integer target'}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Constraints</h4>
                    <ul className="text-xs text-muted space-y-2 list-disc pl-4">
                      {problem?.constraints?.split('\n').map((c, i) => <li key={i}>{c}</li>) || (
                        <>
                          <li>1 &lt;= nums.length &lt;= 10^4</li>
                          <li>-10^9 &lt;= nums[i] &lt;= 10^9</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Example Operations</h4>
                    <div className="space-y-4">
                      {problem?.testCases?.filter(tc => !tc.isHidden).slice(0, 2).map((tc, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden font-mono text-[11px]">
                          <div className="px-4 py-2 border-b border-white/5 bg-white/5 flex justify-between items-center text-[10px] font-black text-muted uppercase tracking-widest">
                            <span>Test Case #{i + 1}</span>
                            <button className="text-primary hover:glow-cyan transition-all">Copy</button>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <span className="text-muted mr-2">Input:</span>
                              <span className="text-white">{tc.input}</span>
                            </div>
                            <div>
                              <span className="text-muted mr-2">Output:</span>
                              <span className="text-green-400">{tc.output}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'console' && (
                <motion.div 
                  key="console"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Terminal className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold tracking-tight">Neural Execution Stream</h3>
                  </div>

                  {!results && !executing && (
                    <div className="flex flex-col items-center justify-center py-24 text-muted/30 space-y-6 border-2 border-dashed border-white/5 rounded-3xl">
                      <Bug className="w-16 h-16 animate-float" />
                      <div className="text-center space-y-1">
                        <p className="text-sm font-bold uppercase tracking-widest">Awaiting Operation</p>
                        <p className="text-[10px]">Execute or submit code to verify neural logic.</p>
                      </div>
                    </div>
                  )}

                  {executing && (
                    <div className="space-y-8 py-12">
                      <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-0 w-1/2 bg-quantum-gradient shadow-neon-cyan"
                        />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="font-mono text-[10px] text-primary animate-pulse tracking-[0.5em] uppercase font-black">Syncing with Judge0 Core</p>
                        <p className="text-muted text-[10px]">Processing test cases through neural sandbox...</p>
                      </div>
                    </div>
                  )}

                  {results && (
                    <div className="space-y-6 font-mono text-sm">
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`p-6 rounded-2xl border-2 flex items-center justify-between shadow-2xl ${
                        (results.statusId === 3 || results.summary?.overallResult === 'accepted') 
                          ? 'bg-green-500/10 border-green-500/20 text-green-400 shadow-green-500/5' 
                          : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-red-500/5'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${(results.statusId === 3 || results.summary?.overallResult === 'accepted') ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {(results.statusId === 3 || results.summary?.overallResult === 'accepted') ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                          </div>
                          <div>
                            <span className="font-black uppercase tracking-[0.2em] text-lg block">
                              {results.status || results.summary?.overallResult || 'Verdict Unknown'}
                            </span>
                            <span className="text-[10px] opacity-70">
                              {results.type === 'submit' ? results.summary?.verdictMessage : 'Single Case Operation Successful'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 font-black">
                          <span className="flex items-center gap-2 text-xs opacity-80"><Clock className="w-3.5 h-3.5" /> {results.runtimeMs || results.runtime || results.submission?.runtime || '0'}ms</span>
                          <span className="flex items-center gap-2 text-xs opacity-80"><Cpu className="w-3.5 h-3.5" /> {results.memory || results.submission?.memory || '0'} KB</span>
                        </div>
                      </motion.div>

                      {results.type === 'submit' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="glass-card p-6 border-white/5 bg-white/5">
                            <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-2">Accuracy Rate</p>
                            <div className="flex items-end gap-2">
                              <p className="text-3xl font-black text-primary">{Math.round((results.summary?.passed / results.summary?.totalTests) * 100) || 0}%</p>
                              <p className="text-[10px] text-muted mb-1.5 uppercase font-bold tracking-tighter">Verified</p>
                            </div>
                          </div>
                          <div className="glass-card p-6 border-white/5 bg-white/5">
                            <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-2">Test Stream</p>
                            <div className="flex items-end gap-2">
                              <p className="text-3xl font-black text-white">{results.summary?.passed || 0} / {results.summary?.totalTests || 0}</p>
                              <p className="text-[10px] text-muted mb-1.5 uppercase font-bold tracking-tighter">Passed</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {(results.stdout || results.compileOutput || results.stderr) && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] text-muted font-black uppercase tracking-widest">Output Stream</span>
                            <span className="text-[10px] text-primary/50 font-mono">UTF-8 RAW</span>
                          </div>
                          <pre className="bg-black/40 p-5 rounded-2xl border border-white/5 whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed custom-scrollbar max-h-[300px]">
                            <code className={results.stderr ? 'text-red-400/80' : 'text-primary/90'}>
                              {results.stdout || results.compileOutput || results.stderr}
                            </code>
                          </pre>
                        </div>
                      )}

                      {results.testResults && (
                        <div className="space-y-4">
                          <span className="text-[10px] text-muted font-black uppercase tracking-widest px-2">Neural Test Batch</span>
                          <div className="grid grid-cols-1 gap-2">
                            {results.testResults.map((tr, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                  {tr.isHidden ? <Lock className="w-3.5 h-3.5 text-muted/50" /> : <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />}
                                  <span className="text-[11px] font-bold text-muted uppercase tracking-tighter">
                                    {tr.isHidden ? `Hidden Case #${i + 1}` : `Public Case #${i + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-[10px] font-mono opacity-40">{tr.runtime || '0ms'}</span>
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${tr.passed ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                    {tr.passed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'hints' && (
                <motion.div 
                  key="hints"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <BrainCircuit className="w-5 h-5 text-secondary" />
                    <h3 className="text-xl font-bold tracking-tight">AI Neural Insights</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {hints.map((hint, i) => (
                      <div key={hint.id} className="p-6 bg-secondary/5 border border-secondary/10 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                          <Zap className="w-8 h-8 text-secondary" />
                        </div>
                        <h4 className="text-xs font-black text-secondary uppercase tracking-[0.2em] mb-2">{hint.title}</h4>
                        <p className="text-sm text-muted leading-relaxed">{hint.content}</p>
                      </div>
                    ))}
                    
                    <button className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted hover:border-secondary/30 hover:text-secondary transition-all flex items-center justify-center gap-2">
                      Unlock Advanced Neural Analysis
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#0d1117]">
          <div className="h-10 bg-surface/50 border-b border-white/5 flex items-center px-4 justify-between select-none">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-primary/50 font-black uppercase tracking-[0.2em]">Active Workspace</span>
              <div className="h-3 w-px bg-white/10" />
              <span className="text-[10px] text-muted font-bold tracking-widest">Main.{language === 'python3' ? 'py' : language === 'javascript' ? 'js' : language}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
              <span className="text-[9px] text-muted font-black uppercase tracking-widest">V6 Neural Core Active</span>
            </div>
          </div>
          <div className="flex-1">
            <CodeEditor
              language={language}
              code={code}
              setCode={handleCodeChange}
            />
          </div>
          <div className="h-8 bg-surface/30 border-t border-white/5 flex items-center px-6 justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted/50">
            <span>SkillConnect AI Environment v1.0.4</span>
            <div className="flex gap-4">
              <span>Ln 1, Col 1</span>
              <span>UTF-8</span>
              <span>Spaces: 4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
