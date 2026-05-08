import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  CheckCircle2, 
  Circle, 
  Lock, 
  ChevronRight, 
  Zap, 
  Brain, 
  Target,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

const Roadmap = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const allTopics = [
    'Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues',
    'Trees', 'Graphs', 'Dynamic Programming', 'Sorting',
    'Searching', 'Hashing', 'Recursion', 'Bit Manipulation',
    'Greedy', 'Backtracking'
  ];

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roadmap');
      setRoadmap(response.data);
    } catch (err) {
      console.error('Failed to fetch roadmap', err);
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    try {
      setRefreshing(true);
      await api.post('/roadmap/generate');
      await fetchRoadmap();
    } catch (err) {
      console.error('Failed to generate roadmap', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
        <span className="text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">Calculating Optimal Path</span>
      </div>
    );
  }

  const completed = roadmap?.completedTopics || [];
  const currentTopic = roadmap?.currentTopic || 'Arrays';
  const progress = roadmap?.progressPercentage || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic italic">Neural Roadmap</h1>
          <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">Your optimized algorithmic progression sequence</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-end">
            <span className="text-[8px] font-black uppercase text-muted tracking-widest">Total Sync</span>
            <span className="text-lg font-black text-primary">{progress}%</span>
          </div>
          <button 
            onClick={generateRoadmap}
            disabled={refreshing}
            className="neon-button-cyan p-3 rounded-2xl flex items-center justify-center disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Progress Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted mb-4">Current Objective</h3>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <p className="text-[10px] font-black text-primary uppercase mb-1">Active Unit</p>
              <h4 className="text-xl font-bold text-white">{currentTopic}</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-muted">
                <span>Pathway Depth</span>
                <span>{completed.length} / {allTopics.length} Units</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-quantum-gradient shadow-neon-cyan"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted mb-6">Neural Tips</h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 italic">
                <Brain className="w-5 h-5 text-secondary shrink-0" />
                <p className="text-[10px] text-muted leading-relaxed">"Master recursion early; it unlocks the logic required for Trees and DP."</p>
              </div>
              <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 italic">
                <Target className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[10px] text-muted leading-relaxed">"Focus on space complexity for Linked List problems to optimize memory units."</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Roadmap Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allTopics.map((topic, i) => {
              const isCompleted = completed.includes(topic);
              const isActive = topic === currentTopic;
              const isLocked = !isCompleted && !isActive;

              return (
                <motion.div
                  key={topic}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-6 rounded-3xl border-2 transition-all relative group cursor-pointer ${
                    isActive ? 'bg-primary/10 border-primary shadow-neon-cyan' :
                    isCompleted ? 'bg-white/5 border-green-500/30' :
                    'bg-white/2 border-white/5 opacity-60 grayscale'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${
                      isActive ? 'bg-primary/20 text-primary' :
                      isCompleted ? 'bg-green-500/20 text-green-400' :
                      'bg-white/5 text-muted'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                       isActive ? <Zap className="w-5 h-5 animate-pulse" /> :
                       <Lock className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-mono text-muted/50">#{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{topic}</h4>
                    <p className="text-[10px] text-muted uppercase font-black tracking-widest">
                      {isCompleted ? 'Module Synchronized' :
                       isActive ? 'Synchronization Active' :
                       'Module Locked'}
                    </p>
                  </div>

                  {isActive && (
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-[9px] font-black text-primary uppercase animate-pulse">Neural Link Ready</span>
                      <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}

                  {!isLocked && !isActive && (
                    <div className="mt-6">
                      <span className="text-[9px] font-black text-green-400/50 uppercase tracking-widest">Archive Accessible</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Roadmap;
