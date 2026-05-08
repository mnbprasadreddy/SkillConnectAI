import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  History, 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Award,
  Video,
  FileText,
  Zap,
  TrendingUp,
  MoreVertical
} from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ReplayCenter = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await api.get('/reports/mine');
        setReports(response.data || []);
      } catch (err) {
        console.error('Failed to fetch reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
        <span className="text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">Syncing Session Archives</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic italic">Session Replays</h1>
          <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">Review and audit your neural interview sessions</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search Archives..." 
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold outline-none focus:border-primary/50 transition-all w-64"
            />
          </div>
          <button className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
            <Filter className="w-5 h-5 text-muted" />
          </button>
        </div>
      </div>

      {/* Featured Replay Card */}
      {reports.length > 0 && (
        <div className="glass-card p-1 relative overflow-hidden group cursor-pointer" onClick={() => navigate(`/app/interviews/report/${reports[0].interviewId}`)}>
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative glass-card m-0.5 p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-full md:w-1/2 aspect-video bg-black/40 rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
               <Play className="w-20 h-20 text-white drop-shadow-neon-cyan relative z-10 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
               <div className="absolute bottom-6 left-6 z-10">
                 <span className="px-3 py-1 bg-primary text-background text-[8px] font-black uppercase rounded-lg tracking-widest">Latest Session</span>
               </div>
            </div>
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tight">{reports[0].title || 'Technical Synthesis Session'}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-muted">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase">{new Date(reports[0].createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="flex items-center gap-2 text-primary font-black">
                    <Award className="w-4 h-4" />
                    <span className="text-[10px] uppercase">Score: {reports[0].overallScore}%</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-muted uppercase mb-1">Duration</p>
                  <p className="text-sm font-bold">42m 15s</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-muted uppercase mb-1">Confidence</p>
                  <p className="text-sm font-bold text-green-400">Optimal</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-muted uppercase mb-1">Type</p>
                  <p className="text-sm font-bold">Mock AI</p>
                </div>
              </div>

              <button className="neon-button-cyan w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                Full Audit Analysis <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.length > 1 ? reports.slice(1).map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 group hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => navigate(`/app/interviews/report/${report.interviewId}`)}
          >
            <div className="aspect-video bg-black/40 rounded-2xl border border-white/5 mb-6 relative overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
               <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-white/20 group-hover:text-primary transition-all group-hover:scale-110" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate pr-4">{report.title || 'Technical Assessment'}</h4>
                <button className="p-1 hover:bg-white/5 rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-muted" /></button>
              </div>

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{report.overallScore}%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 text-[8px] font-black uppercase">
                  <Video className="w-3 h-3" /> Visual
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 text-[8px] font-black uppercase">
                  <FileText className="w-3 h-3" /> Transcript
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 text-[8px] font-black uppercase text-secondary">
                  <Zap className="w-3 h-3" /> Insights
                </div>
              </div>
            </div>
          </motion.div>
        )) : reports.length <= 1 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl opacity-50">
            <History className="w-12 h-12 text-muted mb-2" />
            <div className="text-center">
              <p className="text-sm font-black text-muted uppercase tracking-widest">Archive Empty</p>
              <p className="text-[10px] text-muted/50 font-bold">Complete your first neural session to populate the Replay Center.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReplayCenter;
