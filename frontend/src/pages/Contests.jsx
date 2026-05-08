import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Clock, 
  Zap, 
  ChevronRight, 
  Target,
  Award,
  Globe,
  Flame,
  Search,
  Timer
} from 'lucide-react';
import api from '../services/api';

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const response = await api.get('/contests');
        setContests(response.data || []);
      } catch (err) {
        console.error('Failed to fetch contests', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
  }, []);

  const filteredContests = contests.filter(c => {
    const now = new Date();
    const startTime = new Date(c.startTime);
    const endTime = new Date(c.endTime);
    
    if (activeTab === 'active') return now >= startTime && now <= endTime;
    if (activeTab === 'upcoming') return now < startTime;
    return now > endTime;
  });

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
        <span className="text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">Scanning Global Neural Arenas</span>
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
          <h1 className="text-4xl font-black tracking-tight uppercase italic italic">Neural Arenas</h1>
          <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">Real-time global synchronization challenges</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {['active', 'upcoming', 'archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-primary text-background shadow-neon-cyan' : 'text-muted hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Arena (if any) */}
      {activeTab === 'active' && filteredContests.length > 0 && (
        <div className="glass-card p-1 relative overflow-hidden group">
          <div className="absolute inset-0 bg-quantum-gradient opacity-10 animate-pulse" />
          <div className="relative glass-card m-0.5 p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <span className="text-[10px] font-black text-red-400 uppercase animate-pulse">Live Arena</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-bold">1.2k Participants Synchronized</span>
                </div>
              </div>
              <h2 className="text-5xl font-black tracking-tighter uppercase italic">{filteredContests[0].title}</h2>
              <p className="text-muted text-sm font-medium leading-relaxed max-w-xl">
                {filteredContests[0].description || "Join the high-frequency neural contest. Solve complex algorithms under intense temporal constraints to climb the global leaderboard."}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                  <Timer className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase">Ending in 02:14:55</span>
                </div>
                <button className="neon-button-cyan px-8 py-3 text-xs font-black uppercase tracking-[0.2em]">Enter Arena</button>
              </div>
            </div>
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
                <Trophy className="w-48 h-48 text-primary drop-shadow-neon-cyan relative z-10" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contest Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContests.length > 0 ? filteredContests.map((contest, i) => (
          <motion.div
            key={contest.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 group hover:border-primary/30 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
              <Globe className="w-16 h-16 text-primary" />
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest">Difficulty</p>
                  <p className="text-xs font-black text-primary uppercase italic">{contest.difficulty || 'Expert'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{contest.title}</h4>
                <div className="flex items-center gap-4 mt-2 text-[10px] font-black text-muted uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(contest.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    <span>850+ Solved</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-surface bg-white/10 flex items-center justify-center text-[8px] font-black">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-surface bg-white/5 flex items-center justify-center text-[8px] font-black text-muted">+</div>
                </div>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest hover:gap-3 transition-all">
                  Arena Profile <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl">
            <Search className="w-12 h-12 text-muted opacity-20" />
            <div className="text-center">
              <p className="text-sm font-black text-muted uppercase tracking-widest">No Arenas Detected</p>
              <p className="text-[10px] text-muted/50 font-bold">Scanning for the next global synchronization cycle...</p>
            </div>
          </div>
        )}
      </div>

      {/* Global Ranking Preview */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <Award className="w-5 h-5 text-secondary" />
            <span className="uppercase tracking-tight">Global Leaderboard Status</span>
          </h3>
          <button className="text-[10px] font-black text-muted uppercase tracking-widest hover:text-white transition-colors">View All Synchronized Units</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black text-muted uppercase tracking-widest border-b border-white/5">
                <th className="pb-4 text-left px-4">Rank</th>
                <th className="pb-4 text-left px-4">Neural Unit</th>
                <th className="pb-4 text-left px-4">Arena Points</th>
                <th className="pb-4 text-left px-4">Stability</th>
                <th className="pb-4 text-right px-4">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                { rank: 1, name: 'Neural_Overlord', points: '14,205', stability: '99.4%', color: 'text-amber-400' },
                { rank: 2, name: 'Quantum_Coder', points: '12,890', stability: '98.1%', color: 'text-slate-300' },
                { rank: 3, name: 'Logic_Ghost', points: '11,540', stability: '97.5%', color: 'text-amber-700' }
              ].map((user) => (
                <tr key={user.rank} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="py-6 px-4 font-black">
                    <span className={user.color}>#{user.rank}</span>
                  </td>
                  <td className="py-6 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10" />
                      <span className="font-bold">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-6 px-4 font-mono text-primary font-bold">{user.points}</td>
                  <td className="py-6 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[60px]">
                        <div className="h-full bg-primary" style={{ width: user.stability }} />
                      </div>
                      <span className="text-[10px] font-black">{user.stability}</span>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-right">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Users className="w-4 h-4 text-muted" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Contests;
