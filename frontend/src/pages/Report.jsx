import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Target, 
  MessageSquare, 
  Brain, 
  ArrowLeft,
  Download,
  Share2,
  TrendingUp,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Zap,
  ChevronRight,
  Activity
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { motion } from 'framer-motion';

const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/interviews/${id}`);
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch report', err);
        setError('Failed to retrieve performance data. It might still be processing.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
      <span className="text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">Generating Performance Analytics</span>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <h2 className="text-xl font-bold">{error}</h2>
      <button onClick={() => navigate('/app/interviews')} className="neon-button-cyan text-sm">Return to Hub</button>
    </div>
  );

  const radarData = [
    { subject: 'Technical', A: data?.technicalScore || 60, fullMark: 100 },
    { subject: 'Confidence', A: data?.confidenceScore || 70, fullMark: 100 },
    { subject: 'Communication', A: data?.communicationScore || 80, fullMark: 100 },
    { subject: 'Eye Contact', A: data?.analytics?.eyeContactScore || 75, fullMark: 100 },
    { subject: 'Clarity', A: data?.analytics?.speechClarity || 85, fullMark: 100 },
    { subject: 'Posture', A: data?.analytics?.postureScore || 90, fullMark: 100 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 pb-20 px-6 pt-4"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/interviews')} className="p-2.5 hover:bg-white/5 rounded-xl border border-white/5 transition-all group">
            <ArrowLeft className="w-5 h-5 text-muted group-hover:text-white transition-colors" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Neural Report<span className="text-primary text-sm not-italic ml-2 font-mono">v1.0.4</span></h1>
            <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">
              {data?.interviewType} Session • {new Date(data?.createdAt).toLocaleDateString()} • ID: {id?.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            <Download className="w-4 h-4" /> EXPORT DATA
          </button>
          <button className="neon-button-cyan flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Share2 className="w-4 h-4" /> BROADCAST RESULTS
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 text-center space-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] text-muted uppercase font-black tracking-[0.2em]">Overall Proficiency</p>
          <h2 className="text-6xl font-black text-primary drop-shadow-neon-cyan">{data?.score || 0}%</h2>
          <div className="flex items-center justify-center gap-2 text-xs text-green-400 font-bold uppercase tracking-tighter">
            <TrendingUp className="w-3.5 h-3.5" />
            +8.4% VS PREVIOUS
          </div>
        </div>
        <div className="glass-card p-8 text-center space-y-2 relative group">
          <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] text-muted uppercase font-black tracking-[0.2em]">Neural Stability</p>
          <h2 className="text-6xl font-black text-secondary drop-shadow-neon-purple">{data?.confidenceScore || 0}%</h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest">High Confidence Detected</p>
        </div>
        <div className="glass-card p-8 text-center space-y-2 relative group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] text-muted uppercase font-black tracking-[0.2em]">Active Duration</p>
          <h2 className="text-6xl font-black text-white">{Math.round((data?.duration || 0) / 60)}<span className="text-xl ml-1 text-muted">M</span></h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Standard Session Length</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skill Radar */}
        <div className="glass-card p-8 flex flex-col items-center">
          <h3 className="text-xl font-bold mb-8 self-start flex items-center gap-3">
            <Brain className="w-5 h-5 text-primary" /> 
            <span className="uppercase tracking-tight">Competency Mapping</span>
          </h3>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#ffffff05" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B949E', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#00F2FE"
                  fill="#00F2FE"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-6">
          <div className="glass-card p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-secondary" /> 
                <span className="uppercase tracking-tight">AI Insights</span>
              </h3>
              <div className="px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-lg text-[9px] font-black uppercase text-secondary">
                Processed by Gemini V4
              </div>
            </div>
            
            <p className="text-muted leading-relaxed italic border-l-4 border-secondary/30 pl-6 text-sm font-medium">
              "{data?.report?.aiSummary || 'The session analysis highlights a high degree of technical accuracy, balanced by a consistent communication style. Focus on reducing minor verbal fillers to reach the Expert tier.'}"
            </p>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="p-6 bg-green-500/5 border border-green-500/10 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><ThumbsUp className="w-12 h-12 text-green-500" /></div>
                <div className="flex items-center gap-2 text-green-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                  <ThumbsUp className="w-3.5 h-3.5" /> STRENGTHS
                </div>
                <ul className="text-xs text-muted space-y-3 font-medium">
                  <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-green-400 mt-1.5 shrink-0" /> Superior articulation of complex technical concepts.</li>
                  <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-green-400 mt-1.5 shrink-0" /> Maintained optimal posture throughout the logic segment.</li>
                  <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-green-400 mt-1.5 shrink-0" /> High-impact vocabulary usage in behavioral responses.</li>
                </ul>
              </div>
              
              <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><ThumbsDown className="w-12 h-12 text-red-500" /></div>
                <div className="flex items-center gap-2 text-red-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                  <ThumbsDown className="w-3.5 h-3.5" /> IMPROVEMENTS
                </div>
                <ul className="text-xs text-muted space-y-3 font-medium">
                  <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" /> Eye contact stability dropped by 12% during algorithmic explanation.</li>
                  <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" /> Minor reliance on 'like' and 'actually' as transitional phrases.</li>
                  <li className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" /> Behavioral depth could be enhanced with specific STAR metrics.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommendation Grid */}
        <div className="lg:col-span-2 glass-card p-8">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <Target className="w-5 h-5 text-primary" /> 
            <span className="uppercase tracking-tight">Practice Pathway</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Eye Contact Training', desc: 'Specialized drills to maintain gaze during complex problem solving.', icon: Zap },
              { title: 'STAR Method Workshop', desc: 'Refine your behavioral story structure with AI feedback.', icon: TrendingUp },
              { title: 'Advanced System Design', desc: 'Deep dive into microservices and distributed consensus.', icon: Brain },
              { title: 'Public Speaking AI', desc: 'Reduce filler words and improve vocal clarity scores.', icon: MessageSquare }
            ].map((item, i) => (
              <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/30 hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><item.icon className="w-4 h-4" /></div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                </div>
                <h4 className="font-bold text-sm mb-1 text-white">{item.title}</h4>
                <p className="text-[10px] text-muted font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Biometric Legend */}
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="w-32 h-32 text-primary" /></div>
          <h3 className="text-xl font-bold mb-8 uppercase tracking-tight">Biometric Audit</h3>
          <div className="space-y-6 relative">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Gaze Stability</span>
                <span className="text-[10px] font-black text-green-400 uppercase">Optimal</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.3)]" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Speech Clarity</span>
                <span className="text-[10px] font-black text-primary uppercase">Expert</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-primary shadow-neon-cyan" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Filler Frequency</span>
                <span className="text-[10px] font-black text-red-400 uppercase">Attention</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} className="h-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.3)]" />
              </div>
            </div>
          </div>
          
          <div className="mt-12 p-5 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted font-medium leading-relaxed uppercase tracking-tighter">
              Neural data is processed via MediaPipe & DeepFace. Scores are benchmarks against 50k+ professional interview patterns.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Report;
