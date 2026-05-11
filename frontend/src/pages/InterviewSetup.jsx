import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Server, Layout, Cloud, Lock, Database, Code2, BrainCircuit,
  ArrowRight, Activity, ArrowLeft, Clock, MessageSquare
} from 'lucide-react';

const ROLES = [
  { id: 'Frontend',      icon: Layout,      desc: 'React, Hooks, UI Architecture' },
  { id: 'Backend',       icon: Server,      desc: 'Node.js, APIs, Databases' },
  { id: 'Full Stack',    icon: Code2,       desc: 'End-to-end Architecture' },
  { id: 'DevOps',        icon: Cloud,       desc: 'CI/CD, Kubernetes, AWS' },
  { id: 'AI/ML',         icon: BrainCircuit,desc: 'Models, Pipelines, Python' },
  { id: 'Cybersecurity', icon: Lock,        desc: 'SecOps, Audits, Encryption' },
  { id: 'Cloud',         icon: Activity,    desc: 'AWS, Azure, Scalability' },
  { id: 'Data Science',  icon: Database,    desc: 'Analytics, Big Data, SQL' },
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const DURATIONS    = [15, 30, 45];
const HR_TONES     = [
  { id: 'friendly',     label: 'Friendly',          desc: 'Supportive, encouraging' },
  { id: 'professional', label: 'Professional',       desc: 'Standard corporate tone' },
  { id: 'aggressive',   label: 'High Pressure',      desc: 'Challenging recruiter' },
];

const InterviewSetup = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const queryType  = new URLSearchParams(location.search).get('type') || 'technical';

  const [selectedRole,       setSelectedRole]       = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Intermediate');
  const [selectedDuration,   setSelectedDuration]   = useState(30);
  const [selectedTone,       setSelectedTone]       = useState('professional');
  const [isInitializing,     setIsInitializing]     = useState(false);

  const isHR      = queryType === 'behavioral' || queryType === 'hr';
  const needsRole = queryType === 'technical' || queryType === 'coding' || queryType === 'system_design';

  // Behavioral shortcut — still goes through setup now (for duration)
  const canStart = needsRole ? !!selectedRole : true;

  const handleStart = () => {
    if (!canStart || isInitializing) return;
    setIsInitializing(true);
    setTimeout(() => {
      const params = new URLSearchParams({
        type:       queryType,
        difficulty: selectedDifficulty,
        duration:   selectedDuration * 60, // convert to seconds
        ...(needsRole && selectedRole ? { role: selectedRole } : {}),
        ...(isHR ? { tone: selectedTone } : {}),
      });
      navigate(`/interviews/live/new?${params.toString()}`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl relative z-10 glass-card p-10 rounded-3xl"
      >
        <button
          onClick={() => navigate('/app/interviews')}
          className="flex items-center gap-2 text-muted hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </button>

        <h1 className="text-4xl font-bold tracking-tight mb-2">Configure Neural Protocol</h1>
        <p className="text-muted mb-8">
          {isHR ? 'Configure your HR interview session.' : 'Select your discipline, difficulty, and session length.'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Role selector (for technical/coding) or HR tone */}
          <div className="lg:col-span-2 space-y-6">
            {needsRole && (
              <>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Target Discipline</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedRole === role.id
                          ? 'bg-primary/20 border-primary shadow-neon-cyan'
                          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-1.5">
                        <role.icon className={`w-5 h-5 ${selectedRole === role.id ? 'text-primary' : 'text-muted'}`} />
                        <span className="font-bold text-sm">{role.id}</span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{role.desc}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {isHR && (
              <>
                <h3 className="text-sm font-black uppercase tracking-widest text-secondary">Interview Tone</h3>
                <div className="grid grid-cols-3 gap-3">
                  {HR_TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTone(t.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedTone === t.id
                          ? 'bg-secondary/20 border-secondary shadow-neon-purple'
                          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <MessageSquare className={`w-5 h-5 mb-2 ${selectedTone === t.id ? 'text-secondary' : 'text-muted'}`} />
                      <p className="font-bold text-sm mb-1">{t.label}</p>
                      <p className="text-[10px] text-muted">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Difficulty + Duration + Launch */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-secondary mb-3">Difficulty</h3>
              <div className="flex flex-col gap-2">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedDifficulty === diff
                        ? 'bg-secondary/20 border-secondary shadow-neon-purple text-white'
                        : 'bg-white/5 border-white/10 text-muted hover:border-white/20'
                    }`}
                  >
                    <span className="font-bold text-sm">{diff}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration picker */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Duration
              </h3>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={`flex-1 py-3 rounded-xl border font-black text-sm transition-all ${
                      selectedDuration === d
                        ? 'bg-primary/20 border-primary text-primary shadow-neon-cyan'
                        : 'bg-white/5 border-white/10 text-muted hover:border-white/20'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleStart}
                disabled={!canStart || isInitializing}
                className="w-full py-4 rounded-xl font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-background hover:shadow-neon-cyan"
              >
                {isInitializing
                  ? <span className="animate-pulse">Initializing...</span>
                  : <> Launch Protocol <ArrowRight className="w-5 h-5" /> </>
                }
              </button>
              {needsRole && !selectedRole && (
                <p className="text-[10px] text-muted text-center mt-2">Select a discipline to continue</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InterviewSetup;
