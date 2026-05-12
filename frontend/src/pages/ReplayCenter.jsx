import React, { useState, useEffect, useRef } from 'react';
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
  MoreVertical,
  X,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ReplayCenter = () => {
  const [replays, setReplays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReplay, setSelectedReplay] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const fetchReplays = async () => {
    try {
      setLoading(true);
      const response = await api.get('/replays');
      const raw = response.data?.data || response.data || [];
      setReplays(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to fetch replays', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplays();
    return () => {
      // Cleanup on unmount
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this replay? This action cannot be undone.')) return;
    try {
      await api.delete(`/replays/${id}`);
      setReplays(replays.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete replay:', err);
      alert('Failed to delete replay.');
    }
  };

  const openReplay = (replay) => {
    if (!replay.videoUrl) {
      alert('No video available for this session.');
      return;
    }
    setSelectedReplay(replay);
  };

  const closeReplay = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      if (videoRef.current.src) {
        URL.revokeObjectURL(videoRef.current.src);
      }
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    setSelectedReplay(null);
  };

  const formatDuration = (secs) => {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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
          <h1 className="text-4xl font-black tracking-tight uppercase italic">Session Replays</h1>
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
      {replays.length > 0 && (
        <div className="glass-card p-1 relative overflow-hidden group cursor-pointer" onClick={() => openReplay(replays[0])}>
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative glass-card m-0.5 p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-full md:w-1/2 aspect-video bg-black/40 rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
               {replays[0].videoUrl ? (
                 <Play className="w-20 h-20 text-white drop-shadow-neon-cyan relative z-10 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
               ) : (
                 <Video className="w-20 h-20 text-white/10 relative z-10" />
               )}
               <div className="absolute bottom-6 left-6 z-10">
                 <span className="px-3 py-1 bg-primary text-background text-[8px] font-black uppercase rounded-lg tracking-widest">Latest Session</span>
               </div>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tight capitalize">{replays[0].interview?.interviewType?.replace('_', ' ') || 'Interview'} Session</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-muted">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">{new Date(replays[0].createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-2 text-primary font-black">
                      <Award className="w-4 h-4" />
                      <span className="text-[10px] uppercase">Score: {replays[0].interview?.score ?? 'N/A'}%</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDelete(replays[0].id, e)}
                  className="p-2 hover:bg-red-500/10 text-muted hover:text-red-400 rounded-lg transition-colors"
                  title="Delete Replay"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-muted uppercase mb-1">Duration</p>
                  <p className="text-sm font-bold">{formatDuration(replays[0].duration)}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-muted uppercase mb-1">File Size</p>
                  <p className="text-sm font-bold text-green-400">{formatSize(replays[0].size)}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-muted uppercase mb-1">Type</p>
                  <p className="text-sm font-bold capitalize">{replays[0].interview?.interviewType || 'Mock'}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => openReplay(replays[0])} className="neon-button-cyan flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                  Play Recording <Play className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigate('/app/interviews/analytics'); }} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center">
                  Analytics <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {replays.length > 1 ? replays.slice(1).map((replay, i) => (
          <motion.div
            key={replay.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 group hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => openReplay(replay)}
          >
            <div className="aspect-video bg-black/40 rounded-2xl border border-white/5 mb-6 relative overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
               {replay.videoUrl ? (
                 <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-white/20 group-hover:text-primary transition-all group-hover:scale-110" />
               ) : (
                 <Video className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-white/10" />
               )}
               <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[8px] font-mono text-muted">
                 {formatDuration(replay.duration)}
               </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate pr-4 capitalize">{replay.interview?.interviewType?.replace('_', ' ') || 'Interview Session'}</h4>
                <button 
                  onClick={(e) => handleDelete(replay.id, e)}
                  className="p-1 hover:bg-red-500/10 rounded-lg transition-colors text-muted hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(replay.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{replay.interview?.score ?? 'N/A'}%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 text-[8px] font-black uppercase">
                  <Video className="w-3 h-3" /> {formatSize(replay.size)}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/app/interviews/analytics'); }}
                  className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20 text-[8px] font-black uppercase hover:bg-primary/20 transition-colors"
                >
                  <Zap className="w-3 h-3" /> Insights
                </button>
              </div>
            </div>
          </motion.div>
        )) : replays.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl opacity-50">
            <History className="w-12 h-12 text-muted mb-2" />
            <div className="text-center">
              <p className="text-sm font-black text-muted uppercase tracking-widest">Archive Empty</p>
              <p className="text-[10px] text-muted/50 font-bold">Complete your first neural session to populate the Replay Center.</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedReplay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-10 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
              {/* Close Button */}
              <button 
                onClick={closeReplay}
                className="absolute top-4 right-4 z-50 p-3 bg-black/50 hover:bg-red-500/20 text-white hover:text-red-400 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Lazy loaded video */}
              <video 
                ref={videoRef}
                src={selectedReplay.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
                controlsList="nodownload"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReplayCenter;
