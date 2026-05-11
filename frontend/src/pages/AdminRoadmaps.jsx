import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Plus, Sparkles, Archive, RotateCcw, Loader2, Brain,
  ChevronRight, Clock, BookOpen, AlertTriangle, CheckCircle2, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ROLE_TRACKS = ['Frontend', 'Backend', 'Full Stack', 'DevOps', 'AI/ML', 'Cybersecurity', 'Cloud', 'Data Science'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const AdminRoadmaps = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', roleTrack: 'Full Stack', difficulty: 'Beginner' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/roadmaps');
      setTopics(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTopics(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Topic title is required'); return; }
    setError(''); setSuccess(''); setGenerating(true);

    try {
      await api.post('/admin/roadmaps/generate', form);
      setSuccess(`Roadmap "${form.title}" generated successfully!`);
      setForm({ title: '', roleTrack: 'Full Stack', difficulty: 'Beginner' });
      setShowForm(false);
      await fetchTopics();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Generation failed';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const [regeneratingId, setRegeneratingId] = useState(null);

  const handleArchive = async (id) => {
    try {
      await api.patch(`/admin/roadmaps/${id}/archive`);
      await fetchTopics();
    } catch (err) {
      console.error('Archive failed', err);
    }
  };

  const handleRegenerate = async (id, title) => {
    if (!window.confirm(`Regenerate AI content for "${title}"?\n\nThis will delete and recreate all modules with fresh Gemini content.`)) return;
    try {
      setError('');
      setRegeneratingId(id);
      await api.post(`/admin/roadmaps/${id}/regenerate`);
      setSuccess(`"${title}" content regenerated successfully!`);
      await fetchTopics();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Regeneration failed';
      setError(msg);
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/admin')} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase italic">Roadmap Manager</h1>
            <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">AI-generated adaptive curriculum system</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="neon-button-cyan flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
          {showForm ? <RotateCcw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Generate Roadmap'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400 font-bold">{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm text-green-400 font-bold">{success}</span>
        </div>
      )}

      {/* Generation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleGenerate}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
          >
            <div className="glass-card p-8 border-primary/20 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest">Gemini AI Generation</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Topic Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Dynamic Programming"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Role Track</label>
                  <select value={form.roleTrack} onChange={e => setForm({ ...form, roleTrack: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-primary/50 transition-all appearance-none">
                    {ROLE_TRACKS.map(r => <option key={r} value={r} className="bg-[#0a0f1a]">{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-primary/50 transition-all appearance-none">
                    {DIFFICULTIES.map(d => <option key={d} value={d} className="bg-[#0a0f1a]">{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={generating}
                  className="neon-button-cyan flex items-center gap-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  {generating ? 'Gemini Generating...' : 'Generate with Gemini AI'}
                </button>
              </div>

              <p className="text-[9px] text-muted text-center">
                Gemini will generate 8-15 progressive modules with concepts, milestones, and checkpoints. This may take 10-20 seconds.
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Roadmap List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-xs font-black uppercase tracking-widest text-muted">Loading Roadmaps...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.length === 0 && (
            <div className="glass-card p-16 flex flex-col items-center justify-center text-center space-y-4">
              <Map className="w-16 h-16 text-muted opacity-20" />
              <h3 className="text-xl font-bold">No Roadmaps Created</h3>
              <p className="text-sm text-muted max-w-sm">Click "Generate Roadmap" to create an AI-powered learning curriculum.</p>
            </div>
          )}

          {topics.map((topic, i) => (
            <motion.div key={topic.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass-card p-6 flex items-center gap-6 group hover:border-primary/30 transition-all ${topic.isArchived ? 'opacity-50' : ''}`}
            >
              <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                <Map className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold">{topic.title}</h3>
                  {topic.isArchived && (
                    <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[9px] font-black uppercase text-red-400">Archived</span>
                  )}
                  <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[9px] font-black uppercase text-cyan-400">{topic.roleTrack}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                    topic.difficulty === 'Advanced' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    topic.difficulty === 'Intermediate' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-green-500/10 border-green-500/20 text-green-400'
                  }`}>{topic.difficulty}</span>
                </div>
                <p className="text-xs text-muted mt-1">{topic.description}</p>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-muted">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {topic.moduleCount || topic.totalModules} modules</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(topic.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Regenerate content button */}
                <button
                  onClick={() => handleRegenerate(topic.id, topic.title)}
                  disabled={regeneratingId === topic.id}
                  className="p-3 bg-primary/5 border border-primary/15 rounded-xl hover:bg-primary/10 transition-all disabled:opacity-50"
                  title="Regenerate AI content for this roadmap"
                >
                  {regeneratingId === topic.id
                    ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    : <RefreshCw className="w-4 h-4 text-primary" />
                  }
                </button>

                {/* Archive / Restore button */}
                <button onClick={() => handleArchive(topic.id)}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                  title={topic.isArchived ? 'Restore' : 'Archive'}>
                  {topic.isArchived ? <RotateCcw className="w-4 h-4 text-green-400" /> : <Archive className="w-4 h-4 text-muted" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminRoadmaps;
