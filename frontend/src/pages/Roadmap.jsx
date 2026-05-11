import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, CheckCircle2, Lock, ChevronRight, Zap,
  RefreshCw, Clock, BookOpen, ArrowLeft, Award,
  ChevronDown, Star, Activity, Lightbulb
} from 'lucide-react';
import api from '../services/api';
import RoadmapModuleView from '../components/roadmap/RoadmapModuleView';

const ROLE_FILTERS = ['All', 'Frontend', 'Backend', 'Full Stack', 'DevOps', 'AI/ML', 'Cybersecurity', 'Cloud', 'Data Science'];

const difficultyColors = {
  Beginner: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', bar: 'bg-green-500' },
  Intermediate: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', bar: 'bg-amber-500' },
  Advanced: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', bar: 'bg-red-500' },
};

const Roadmap = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('All');
  const [expandedModule, setExpandedModule] = useState(null);
  const [completing, setCompleting] = useState(null);

  // ─── Fetch all topics ──────────────────────────────────────
  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roadmap/topics');
      const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setTopics(data);
    } catch (err) {
      console.error('Failed to fetch topics', err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch topic detail ────────────────────────────────────
  const fetchTopicDetail = async (slug) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/roadmap/topics/${slug}`);
      setSelectedTopic(res?.data || res);
    } catch (err) {
      console.error('Failed to fetch topic', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Complete module ───────────────────────────────────────
  const handleComplete = async (moduleId) => {
    try {
      setCompleting(moduleId);
      await api.post('/roadmap/progress', { moduleId });
      if (selectedTopic) {
        await fetchTopicDetail(selectedTopic.slug);
      }
    } catch (err) {
      console.error('Complete failed', err);
    } finally {
      setCompleting(null);
    }
  };

  useEffect(() => { fetchTopics(); }, []);

  // ─── Filter topics ────────────────────────────────────────
  const filteredTopics = roleFilter === 'All' ? topics : topics.filter(t => t.roleTrack === roleFilter);

  // ─── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
        <span className="text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">Loading Neural Pathways</span>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // DETAIL VIEW — Show modules for selected topic
  // ═══════════════════════════════════════════════════════════

  if (selectedTopic) {
    const topic = selectedTopic;
    const dc = difficultyColors[topic.difficulty] || difficultyColors.Beginner;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pb-20">
        {/* Back + Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedTopic(null)}
              className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase italic">{topic.title}</h1>
              <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">{topic.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${dc.bg} ${dc.border} ${dc.text}`}>{topic.difficulty}</span>
            <span className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-black uppercase text-cyan-400">{topic.roleTrack}</span>
            <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-lg font-black text-primary">{topic.progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="glass-card p-4">
          <div className="flex justify-between text-[10px] font-black uppercase text-muted mb-2">
            <span>Module Progress</span>
            <span>{topic.completedModules} / {topic.totalModules} completed</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${topic.progressPercent}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-quantum-gradient shadow-neon-cyan rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Module Timeline */}
          <div className="lg:col-span-3 space-y-4">
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              (topic.modules || []).map((mod, i) => {
                const isExpanded = expandedModule === mod.id;
                const mdc = difficultyColors[mod.difficulty] || difficultyColors.Beginner;

                return (
                  <motion.div key={mod.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`glass-card overflow-hidden transition-all ${
                      mod.isCompleted ? 'border-green-500/20' :
                      mod.isLocked ? 'opacity-50 grayscale' :
                      'border-primary/20 shadow-neon-cyan/10'
                    }`}
                  >
                    <div className="p-5 flex items-center gap-4 cursor-pointer"
                      onClick={() => !mod.isLocked && setExpandedModule(isExpanded ? null : mod.id)}>
                      {/* Status icon */}
                      <div className={`p-3 rounded-2xl flex-shrink-0 ${
                        mod.isCompleted ? 'bg-green-500/20 text-green-400' :
                        mod.isLocked ? 'bg-white/5 text-muted' :
                        'bg-primary/20 text-primary'
                      }`}>
                        {mod.isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                         mod.isLocked ? <Lock className="w-5 h-5" /> :
                         <Zap className="w-5 h-5 animate-pulse" />}
                      </div>

                      {/* Module info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-muted/40">#{String(i + 1).padStart(2, '0')}</span>
                          <h4 className="text-lg font-bold">{mod.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[9px] font-black uppercase ${mdc.text}`}>{mod.difficulty}</span>
                          {mod.estimatedHours && (
                            <span className="text-[9px] text-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {mod.estimatedHours}h
                            </span>
                          )}
                          {mod.isCompleted && mod.score != null && (
                            <span className="text-[9px] text-green-400 flex items-center gap-1">
                              <Star className="w-3 h-3" /> Score: {mod.score}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action / Expand */}
                      {!mod.isLocked && (
                        <ChevronDown className={`w-5 h-5 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </div>

                    {/* Expanded content — delegated to RoadmapModuleView */}
                    <AnimatePresence>
                      {isExpanded && !mod.isLocked && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                        >
                          <RoadmapModuleView
                            mod={mod}
                            completing={completing}
                            onComplete={handleComplete}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Module overview */}
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 blur-3xl rounded-full" />
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Module Status
              </h4>
              <div className="space-y-2">
                {(topic.modules || []).map((mod, i) => (
                  <div key={mod.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      mod.isCompleted ? 'bg-green-400' : mod.isLocked ? 'bg-white/10' : 'bg-primary animate-pulse'
                    }`} />
                    <span className={`text-[10px] truncate ${
                      mod.isCompleted ? 'text-green-400/60 line-through' : mod.isLocked ? 'text-muted/40' : 'text-white'
                    }`}>{mod.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="glass-card p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 flex-shrink-0"><Lightbulb className="w-4 h-4" /></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">Learning Tip</p>
                  <p className="text-[11px] font-bold text-white/70 leading-relaxed italic">
                    Complete modules sequentially. Each module builds on the previous one to maximize retention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TOPIC GRID — Overview of all roadmap topics
  // ═══════════════════════════════════════════════════════════

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic">Neural Roadmap</h1>
          <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">AI-generated adaptive learning pathways</p>
        </div>
      </div>

      {/* Role Track Filter */}
      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map(role => (
          <button key={role} onClick={() => setRoleFilter(role)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              roleFilter === role
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-white/5 border-white/10 text-muted hover:text-white hover:border-white/20'
            }`}>
            {role}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredTopics.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center space-y-4">
          <Map className="w-16 h-16 text-muted opacity-20" />
          <h3 className="text-xl font-bold">No Learning Paths Available</h3>
          <p className="text-sm text-muted max-w-sm">AI-generated roadmaps will appear here once created by platform admins.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTopics.map((topic, i) => {
            const dc = difficultyColors[topic.difficulty] || difficultyColors.Beginner;
            const isStarted = topic.progressPercent > 0;
            const isComplete = topic.progressPercent >= 100;

            return (
              <motion.div key={topic.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => fetchTopicDetail(topic.slug)}
                className={`glass-card p-6 cursor-pointer group hover:border-primary/30 transition-all relative overflow-hidden ${
                  isComplete ? 'border-green-500/20' : isStarted ? 'border-primary/20' : ''
                }`}
              >
                {/* Completion glow */}
                {isComplete && (
                  <div className="absolute -top-8 -right-8 w-20 h-20 bg-green-500/20 blur-2xl rounded-full" />
                )}

                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${
                    isComplete ? 'bg-green-500/20 text-green-400' :
                    isStarted ? 'bg-primary/20 text-primary' :
                    'bg-white/5 text-muted'
                  }`}>
                    {isComplete ? <Award className="w-5 h-5" /> :
                     isStarted ? <Zap className="w-5 h-5" /> :
                     <Map className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-black uppercase ${dc.text}`}>{topic.difficulty}</span>
                    <span className="text-[9px] font-bold text-cyan-400/60">{topic.roleTrack}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold group-hover:text-primary transition-colors mb-1">{topic.title}</h3>
                {topic.description && <p className="text-xs text-muted line-clamp-2 mb-4">{topic.description}</p>}

                <div className="flex items-center gap-3 text-[10px] text-muted font-bold mb-4">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {topic.totalModules} modules</span>
                  <span>·</span>
                  <span>{topic.completedModules} completed</span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${topic.progressPercent}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-quantum-gradient shadow-neon-cyan'}`} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] font-black uppercase text-muted">
                      {isComplete ? 'Pathway Complete' : isStarted ? 'In Progress' : 'Ready to Start'}
                    </span>
                    <span className={`text-[9px] font-black ${isComplete ? 'text-green-400' : 'text-primary'}`}>
                      {topic.progressPercent}%
                    </span>
                  </div>
                </div>

                {/* Hover CTA */}
                <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                    {isComplete ? 'Review Modules' : isStarted ? 'Continue Learning' : 'Start Pathway'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Roadmap;
