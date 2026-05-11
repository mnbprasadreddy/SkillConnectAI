import React, { useState, useEffect } from 'react';
import { 
  Zap, Target, Brain, Sparkles, RefreshCw, Star, CheckCircle2,
  ChevronRight, Lightbulb, Award, AlertTriangle, TrendingUp,
  BookOpen, Trophy, ArrowRight, BarChart3, Shield, Flame,
  Youtube, FileText, Link2, Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// ─── Severity color mapping ─────────────────────────────────
const severityColors = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', bar: 'bg-red-500', glow: 'shadow-red-500/20' },
  weak: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', bar: 'bg-amber-500', glow: 'shadow-amber-500/20' },
  moderate: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', bar: 'bg-cyan-400', glow: 'shadow-cyan-500/20' },
  strong: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', bar: 'bg-green-500', glow: 'shadow-green-500/20' },
};

const priorityIcons = {
  high: <AlertTriangle className="w-4 h-4 text-red-400" />,
  medium: <Zap className="w-4 h-4 text-amber-400" />,
  low: <TrendingUp className="w-4 h-4 text-cyan-400" />,
};

const typeIcons = {
  problem: <Target className="w-5 h-5" />,
  topic: <Brain className="w-5 h-5" />,
  interview: <Trophy className="w-5 h-5" />,
  general: <Sparkles className="w-5 h-5" />,
  material: <BookOpen className="w-5 h-5" />,
};

const Recommendations = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [weakTopics, setWeakTopics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, topicRes] = await Promise.all([
        api.get('/recommendations').catch(() => ({ data: [] })),
        api.get('/recommendations/weak-topics').catch(() => ({ data: null })),
      ]);
      const recs = Array.isArray(recRes?.data) ? recRes.data : Array.isArray(recRes) ? recRes : [];
      setRecommendations(recs);
      setWeakTopics(topicRes?.data || null);
    } catch (err) {
      console.error('Fetch failed', err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await api.post('/recommendations/generate');
      await fetchData();
    } catch (err) {
      console.error('Regeneration failed', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
        <span className="text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">Analyzing Neural Patterns</span>
      </div>
    );
  }

  // Parse topics
  const allTopicsList = weakTopics?.allTopics || [];
  const weak = weakTopics?.weakTopics || [];
  const strong = weakTopics?.strongTopics || [];

  // Filter recommendations by tab
  const filteredRecs = activeTab === 'all' ? recommendations : recommendations.filter(r => {
    const type = r.type || r.recommendationType || '';
    if (activeTab === 'problems') return type === 'problem';
    if (activeTab === 'interviews') return type === 'interview';
    if (activeTab === 'materials') return type === 'material';
    return true;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic">Neural Insights</h1>
          <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">AI-generated pathways optimized for your growth</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="neon-button-cyan flex items-center gap-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Analyzing...' : 'Regenerate Pathway'}
        </button>
      </div>

      {/* ═══ Weak Topic Radar ═══ */}
      {allTopicsList.length > 0 && (
        <div className="glass-card p-6 border-primary/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">Topic Performance Radar</h2>
              <p className="text-[10px] text-muted mt-0.5">Weighted score: Accuracy 40% · Contests 20% · Interviews 20% · Consistency 10% · Optimization 10%</p>
            </div>
            {weak.length > 0 && (
              <span className="ml-auto px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-400">
                {weak.length} weak {weak.length === 1 ? 'topic' : 'topics'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTopicsList.map((topic, i) => {
              const sev = severityColors[topic.severity] || severityColors.moderate;
              return (
                <motion.div key={topic.topic || i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`p-4 rounded-xl border ${sev.border} ${sev.bg} relative overflow-hidden group`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold truncate">{topic.topic}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${sev.text}`}>
                      {topic.severity}
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${topic.score}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className={`h-full rounded-full ${sev.bar} ${sev.glow}`}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-black ${sev.text}`}>{topic.score}%</span>
                    <div className="flex items-center gap-2 text-[9px] text-muted">
                      {topic.acceptedRate != null && <span title="Accuracy">ACC: {topic.acceptedRate}%</span>}
                      {topic.contestScore != null && <span title="Contest">CTX: {topic.contestScore}%</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Tab Filters ═══ */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All Insights' },
          { key: 'problems', label: 'Problems' },
          { key: 'interviews', label: 'Interviews' },
          { key: 'materials', label: 'Materials' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              activeTab === tab.key
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-white/5 border-white/10 text-muted hover:text-white hover:border-white/20'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ═══ Main Recommendation Feed ═══ */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredRecs.length > 0 ? (
              filteredRecs.map((rec, i) => {
                let content = {};
                try { content = typeof rec.content === 'string' ? JSON.parse(rec.content) : (rec.content || {}); }
                catch { content = {}; }

                const recType = (rec.type || rec.recommendationType || '').toLowerCase();
                const message = content.message || 'Continue with your current practice.';
                const title = (content.type || 'Skill Optimization').replace(/_/g, ' ');
                const explanation = content.explanation || '';
                const priority = content.priority || 'medium';
                const icon = typeIcons[recType] || typeIcons.general;

                return (
                  <motion.div key={rec.id || i}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card p-6 group hover:border-primary/30 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Sparkles className="w-24 h-24 text-primary" />
                    </div>

                    <div className="flex items-start gap-5 relative">
                      <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 flex-shrink-0">
                        {icon}
                      </div>

                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          {priorityIcons[priority]}
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            {priority} Priority
                          </span>
                          <div className="h-px w-6 bg-primary/30" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted capitalize">{recType}</span>
                          {rec.createdAt && (
                            <span className="ml-auto text-[9px] font-mono text-muted">{new Date(rec.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold tracking-tight capitalize">{title}</h3>
                        <p className="text-sm text-muted leading-relaxed">{message}</p>

                        {/* AI Explanation */}
                        {explanation && (
                          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl mt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Brain className="w-3 h-3 text-secondary" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-secondary">AI Insight</span>
                            </div>
                            <p className="text-[11px] text-muted/80 leading-relaxed whitespace-pre-line">{explanation}</p>
                          </div>
                        )}

                        {/* Weak topics in this rec */}
                        {content.weakTopics?.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {content.weakTopics.map((wt, idx) => {
                              const sev = severityColors[wt.severity] || severityColors.weak;
                              return (
                                <span key={idx} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${sev.bg} ${sev.border} ${sev.text}`}>
                                  {wt.topic}: {wt.score}%
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Suggested Problems */}
                        {content.suggestedProblems?.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {content.suggestedProblems.map((prob, idx) => (
                              <button key={idx}
                                onClick={() => navigate(`/problems/${prob.id || ''}`)}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold hover:bg-white/10 transition-all flex items-center gap-1.5 group/btn">
                                {prob.title || `Problem ${idx + 1}`}
                                <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Material Links */}
                        {content.materials?.length > 0 && (
                          <div className="space-y-2 pt-2">
                            {content.materials.map((mat, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors">
                                <BookOpen className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{mat.title}</p>
                                  <p className="text-[10px] text-muted">{mat.topic} · {mat.difficulty}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {mat.articleUrl && <a href={mat.articleUrl} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/10 rounded-lg"><Link2 className="w-3 h-3 text-cyan-400" /></a>}
                                  {mat.youtubeUrl && <a href={mat.youtubeUrl} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/10 rounded-lg"><Youtube className="w-3 h-3 text-red-400" /></a>}
                                  {mat.pdfUrl && <a href={mat.pdfUrl} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-white/10 rounded-lg"><FileText className="w-3 h-3 text-amber-400" /></a>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="glass-card p-20 flex flex-col items-center justify-center text-center space-y-4">
                <Brain className="w-16 h-16 text-muted opacity-20" />
                <h3 className="text-xl font-bold uppercase tracking-tight">No Active Insights</h3>
                <p className="text-sm text-muted max-w-sm">Complete problems, interviews, or contests to unlock your AI-powered growth pathway.</p>
                <button onClick={handleRefresh} className="neon-button-cyan text-[10px] font-black uppercase tracking-widest mt-4">Initialize Analysis</button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ Sidebar ═══ */}
        <div className="space-y-6">
          {/* Power Level */}
          <div className="glass-card p-6 border-primary/20 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 shadow-neon-cyan" /> Topic Summary
            </h4>

            <div className="space-y-4">
              {allTopicsList.length > 0 ? (
                allTopicsList.slice(0, 6).map((topic, i) => {
                  const sev = severityColors[topic.severity] || severityColors.moderate;
                  return (
                    <div key={topic.topic || i} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted truncate max-w-[120px]">{topic.topic}</span>
                        <span className={sev.text}>{topic.score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${topic.score}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                          className={`h-full rounded-full ${sev.bar}`} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] text-muted text-center py-4">Generate recommendations to see your topic analysis.</p>
              )}
            </div>

            {/* Quick Stats */}
            {allTopicsList.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/5">
                <div className="text-center">
                  <p className="text-lg font-black text-green-400">{strong.length}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted">Strong</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-amber-400">{weak.length}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted">Weak</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-red-400">{allTopicsList.filter(t => t.severity === 'critical').length}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted">Critical</p>
                </div>
              </div>
            )}
          </div>

          {/* Weekly Tip */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 flex-shrink-0"><Lightbulb className="w-4 h-4" /></div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">AI Tip</p>
                <p className="text-[11px] font-bold text-white/70 leading-relaxed italic">
                  {weak.length > 0
                    ? `Focus on ${weak[0]?.topic || 'your weakest topics'} first — improving weak areas yields the highest overall score boost.`
                    : 'Keep practicing consistently! Daily engagement builds stronger neural pathways for problem-solving.'}
                </p>
              </div>
            </div>
          </div>

          {/* Neural Rewards */}
          <div className="glass-card p-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary shadow-neon-purple" /> Neural Rewards
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl grayscale opacity-50 relative group">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-xl z-10">
                  <span className="text-[8px] font-black uppercase tracking-widest">Locked: Tier 2 Required</span>
                </div>
                <div className="p-2 bg-secondary/10 rounded-lg text-secondary border border-secondary/20"><Award className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Algorithm Architect</p>
                  <p className="text-[8px] text-muted">Complete 50 Hard Problems</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-primary/5 rounded-xl border border-primary/20">
                <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20 shadow-neon-cyan/20"><CheckCircle2 className="w-4 h-4" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Consistent Unit</p>
                  <p className="text-[8px] text-muted">7 Day Submission Streak</p>
                </div>
              </div>
            </div>

            <button className="w-full mt-5 py-2.5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
              View All Milestones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
