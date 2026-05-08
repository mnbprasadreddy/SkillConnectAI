import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Target, 
  Brain, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Star,
  CheckCircle2,
  Lock,
  ChevronRight,
  Lightbulb,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Recommendations = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recommendations');
      setRecommendations(response.data || []);
    } catch (err) {
      console.error('Failed to fetch recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await api.post('/recommendations/generate');
      await fetchRecommendations();
    } catch (err) {
      console.error('Failed to regenerate recommendations', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
        <span className="text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">Scanning User Neural Patterns</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic italic">Neural Insights</h1>
          <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">AI-generated pathways optimized for your growth</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="neon-button-cyan flex items-center gap-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Regenerating...' : 'Regenerate Pathway'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Recommendation Feed */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => {
                const content = typeof rec.content === 'string' ? JSON.parse(rec.content) : rec.content;
                return (
                  <motion.div 
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-8 group hover:border-primary/30 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Sparkles className="w-24 h-24 text-primary" />
                    </div>
                    
                    <div className="flex items-start gap-6 relative">
                      <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-neon-cyan/10">
                        <Target className="w-8 h-8" />
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Priority Focus</span>
                            <div className="h-px w-8 bg-primary/30" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted capitalize">{rec.reason.replace('_', ' ')}</span>
                          </div>
                          <span className="text-[9px] font-mono text-muted">{new Date(rec.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <h3 className="text-2xl font-bold tracking-tight">{content.topic || 'Skill Optimization'}</h3>
                        <p className="text-sm text-muted leading-relaxed max-w-2xl font-medium">
                          {content.advice || 'Analysis shows consistent progress in this area. Continue with advanced patterns to reach the next tier.'}
                        </p>
                        
                        <div className="flex flex-wrap gap-3 pt-4">
                          {content.suggestedProblems?.map((prob, idx) => (
                            <button 
                              key={idx}
                              onClick={() => navigate('/app/problems')}
                              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 group/btn"
                            >
                              Practice Problem {idx + 1}
                              <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="glass-card p-20 flex flex-col items-center justify-center text-center space-y-4">
                <Brain className="w-16 h-16 text-muted opacity-20" />
                <h3 className="text-xl font-bold uppercase tracking-tight">No Active Insights</h3>
                <p className="text-sm text-muted max-w-sm">Complete more problems or an interview session to unlock your neural growth pathway.</p>
                <button onClick={handleRefresh} className="neon-button-cyan text-[10px] font-black uppercase tracking-widest mt-4">Initialize Analysis</button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar: Growth Stats & Tips */}
        <div className="space-y-6">
          <div className="glass-card p-8 border-primary/20 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 shadow-neon-cyan" /> Power Level
            </h4>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-muted">Algorithm Proficiency</span>
                  <span className="text-white">74%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '74%' }} className="h-full bg-primary shadow-neon-cyan" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-muted">Communication Mastery</span>
                  <span className="text-white">82%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} className="h-full bg-secondary shadow-neon-purple" />
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-4">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Lightbulb className="w-4 h-4" /></div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Weekly Tip</p>
                <p className="text-[10px] font-bold text-white/70 leading-relaxed italic">"Focus on explaining time complexity out loud during practice to sync your technical and communication units."</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary shadow-neon-purple" /> Neural Rewards
            </h4>
            <div className="space-y-4">
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
            
            <button className="w-full mt-6 py-3 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
              View All Milestones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
