import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Server, Layout, Cloud, Lock, Database, Code2, BrainCircuit, ArrowRight, Activity, ArrowLeft } from 'lucide-react';

const ROLES = [
  { id: 'Frontend', icon: Layout, desc: 'React, Hooks, UI Architecture' },
  { id: 'Backend', icon: Server, desc: 'Node.js, APIs, Databases' },
  { id: 'Full Stack', icon: Code2, desc: 'End-to-end Architecture' },
  { id: 'DevOps', icon: Cloud, desc: 'CI/CD, Kubernetes, AWS' },
  { id: 'AI/ML', icon: BrainCircuit, desc: 'Models, Pipelines, Python' },
  { id: 'Cybersecurity', icon: Lock, desc: 'SecOps, Audits, Encryption' },
  { id: 'Cloud', icon: Activity, desc: 'AWS, Azure, Scalability' },
  { id: 'Data Science', icon: Database, desc: 'Analytics, Big Data, SQL' },
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const InterviewSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryType = new URLSearchParams(location.search).get('type') || 'technical';
  
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Intermediate');
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // If it's a behavioral/HR interview, bypass role selection
    if (queryType !== 'technical' && queryType !== 'coding' && queryType !== 'system_design') {
      navigate(`/interviews/live/new?type=${queryType}&difficulty=${selectedDifficulty}`);
    }
  }, [queryType, navigate, selectedDifficulty]);

  const handleStart = () => {
    if (!selectedRole && (queryType === 'technical' || queryType === 'system_design' || queryType === 'coding')) return;
    
    setIsInitializing(true);
    // Simulate slight initialization delay for UI polish before navigating
    setTimeout(() => {
      // Pass role and difficulty to LiveInterview via URL
      navigate(`/interviews/live/new?type=${queryType}&role=${encodeURIComponent(selectedRole)}&difficulty=${selectedDifficulty}`);
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
        <p className="text-muted mb-8">Select your technical discipline and target difficulty level.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Target Discipline</h3>
            <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex items-center gap-3 mb-2">
                    <role.icon className={`w-5 h-5 ${selectedRole === role.id ? 'text-primary' : 'text-muted'}`} />
                    <span className="font-bold">{role.id}</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{role.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary">Difficulty Matrix</h3>
            <div className="flex flex-col gap-3">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedDifficulty === diff 
                      ? 'bg-secondary/20 border-secondary shadow-neon-purple text-white' 
                      : 'bg-white/5 border-white/10 text-muted hover:border-white/20'
                  }`}
                >
                  <span className="font-bold">{diff}</span>
                </button>
              ))}
            </div>

            <div className="pt-8">
              <button
                onClick={handleStart}
                disabled={!selectedRole || isInitializing}
                className="w-full py-4 rounded-xl font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-background hover:shadow-neon-cyan"
              >
                {isInitializing ? (
                  <span className="animate-pulse">Initializing...</span>
                ) : (
                  <>
                    Launch Protocol <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InterviewSetup;
