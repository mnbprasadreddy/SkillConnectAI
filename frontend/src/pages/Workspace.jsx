import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { useAuth } from '../context/AuthContext';
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
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const contestId = searchParams.get('contestId');
  const { refreshUser } = useAuth();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python3');
  const [activeTab, setActiveTab] = useState('description');
  const [results, setResults] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [hints, setHints] = useState([]);
  const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);
  const [userStats, setUserStats] = useState({ attempts: 0, accepted: 0 });

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
        
        let initialCode = '';
        if (data.savedCodes && data.savedCodes[language]) {
          initialCode = data.savedCodes[language].sourceCode;
        } else if (data.starterCode) {
          try {
            const parsed = JSON.parse(data.starterCode);
            initialCode = parsed[language] || '';
          } catch(e) {}
        }
        setCode(initialCode || languages.find(l => l.id === language)?.default || '');
        
        if (data.topic) {
          setHints([
            { id: 1, title: 'Complexity Target', content: `Optimal solution for ${data.topic} usually targets O(N) or O(log N).` },
            { id: 2, title: 'Edge Cases', content: 'Consider empty inputs, negative values, and maximum constraints.' }
          ]);
        }
        
        try {
          const subsRes = await api.get(`/submissions/problem/${id}`);
          const subs = subsRes.data.data || subsRes.data;
          if (Array.isArray(subs)) {
            setUserStats({
              attempts: subs.length,
              accepted: subs.filter(s => s.result === 'accepted').length
            });
          }
        } catch(e) {
          console.error("Failed to fetch user stats for problem");
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

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    
    let newCode = '';
    if (problem?.savedCodes && problem.savedCodes[newLang]) {
      newCode = problem.savedCodes[newLang].sourceCode;
    } else if (problem?.starterCode) {
      try {
        const parsed = JSON.parse(problem.starterCode);
        newCode = parsed[newLang] || '';
      } catch(e) {}
    }
    setCode(newCode || languages.find(l => l.id === newLang)?.default || '');
  };

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
      setResults({
        type: 'run',
        statusId: 13,
        status: 'Execution Failed',
        stderr: err.response?.data?.error || err.message || 'Judge0 execution pipeline failure.',
      });
      setActiveTab('console');
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
      
      const payloadData = response.data || response;
      setResults({ type: 'submit', ...payloadData });
      
      // Synchronize frontend state immediately
      if (payloadData?.submission) {
        const isAccepted = payloadData.submission.result === 'accepted';
        
        setUserStats(prev => ({
          attempts: prev.attempts + 1,
          accepted: prev.accepted + (isAccepted ? 1 : 0)
        }));
        
        if (isAccepted) {
          setProblem(prev => ({ 
            ...prev, 
            isSolved: true,
            savedCodes: {
              ...(prev?.savedCodes || {}),
              [language]: {
                sourceCode: code,
                runtime: payloadData.submission.runtime,
                memory: payloadData.submission.memory,
                submittedAt: payloadData.submission.createdAt
              }
            }
          }));
          
          if (contestId) {
            try {
              // Minimal Contest Wiring: Increment score upon accepted submission
              await api.post(`/contests/${contestId}/submit`, {
                score: 100, // Simplistic score increment for now
                solvedCount: 1
              });
            } catch (e) {
              console.error('Contest score sync failed', e);
            }
          }
          
          if (refreshUser) refreshUser(); // Refresh global user stats for dashboard
        }
      }
      
      setActiveTab('console');
    } catch (err) {
      console.error('Submission failed', err);
      setResults({
        type: 'submit',
        statusId: 13,
        status: 'Submission Failed',
        summary: {
          overallResult: 'Error',
          verdictMessage: err.response?.data?.error || err.message || 'Judge0 submission pipeline failure.',
        },
        stderr: err.response?.data?.error || err.message,
      });
      setActiveTab('console');
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
          <h2 className="font-bold tracking-tight text-sm md:text-base flex items-center gap-2">
            {problem?.title}
            {problem?.isSolved && <CheckCircle2 className="w-4 h-4 text-green-400" />}
          </h2>
          <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-lg border ${
            problem?.difficulty === 'Easy' ? 'border-green-500/50 text-green-400 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
            problem?.difficulty === 'Medium' ? 'border-amber-500/50 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
            'border-red-500/50 text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
          }`}>
            {problem?.difficulty}
          </span>
          {problem?.topic && (
            <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-lg border border-primary/30 text-primary bg-primary/5 backdrop-blur-md">
              {problem.topic}
            </span>
          )}
          {userStats.attempts > 0 && (
            <span className="text-[10px] text-muted ml-4 font-bold tracking-widest hidden md:inline-block">
              ATTEMPTS: {userStats.attempts} <span className="mx-2">|</span> ACCEPTED: {userStats.accepted} <span className="mx-2">|</span> RATE: {Math.round((userStats.accepted / userStats.attempts) * 100)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={language}
            onChange={handleLanguageChange}
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
                    <div className="bg-surface/30 border border-white/5 rounded-2xl p-5 shadow-inner">
                      <ul className="text-xs font-mono text-primary/80 space-y-3 list-none">
                        {problem?.constraints?.split('\n').map((c, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                            {c}
                          </li>
                        )) || (
                          <li className="text-muted/50 italic">No specific constraints provided</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Public Test Cases</h4>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      <div className="flex border-b border-white/5 bg-surface/40 overflow-x-auto custom-scrollbar">
                        {problem?.testCases?.filter(tc => !tc.isHidden).map((tc, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveTestCaseTab(i)}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                              activeTestCaseTab === i ? 'text-primary bg-white/5 border-b-2 border-primary shadow-[inset_0_-2px_10px_rgba(0,255,255,0.1)]' : 'text-muted hover:text-white hover:bg-white/5'
                            }`}
                          >
                            Case {i + 1}
                          </button>
                        ))}
                      </div>
                      
                      <div className="p-5 font-mono text-xs space-y-6">
                        {problem?.testCases?.filter(tc => !tc.isHidden)[activeTestCaseTab] && (
                          <motion.div
                            key={activeTestCaseTab}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                          >
                            <div>
                              <span className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Input</span>
                              <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-white whitespace-pre-wrap">
                                {problem.testCases.filter(tc => !tc.isHidden)[activeTestCaseTab].input}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Expected Output</span>
                              <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-green-400 whitespace-pre-wrap">
                                {problem.testCases.filter(tc => !tc.isHidden)[activeTestCaseTab].expectedOutput}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
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
                          {results.summary?.runtimePercentile !== undefined && results.summary?.runtimePercentile !== null && (
                            <div className="col-span-2 glass-card p-4 border-white/5 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-primary" />
                                <div>
                                  <p className="text-sm font-bold text-white">Beats {results.summary.runtimePercentile}%</p>
                                  <p className="text-[10px] text-muted uppercase tracking-widest font-black">of users in Runtime</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Cpu className="w-5 h-5 text-primary" />
                                <div className="text-right">
                                  <p className="text-sm font-bold text-white">Beats {results.summary.memoryPercentile}%</p>
                                  <p className="text-[10px] text-muted uppercase tracking-widest font-black">of users in Memory</p>
                                </div>
                              </div>
                            </div>
                          )}
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
