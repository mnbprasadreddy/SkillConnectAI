import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Clock, 
  Zap, 
  ChevronRight, 
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Timer
} from 'lucide-react';
import api from '../services/api';

const ContestArena = () => {
  const { id } = useParams();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchContest = async () => {
      try {
        setLoading(true);
        // Ensure user is joined
        await api.post(`/contests/${id}/join`).catch(() => {});
        const response = await api.get(`/contests/${id}`);
        setContest(response.data || null);
      } catch (err) {
        console.error('Failed to fetch contest', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContest();
  }, [id]);

  const calculateTimeLeft = (endTime) => {
    const difference = +new Date(endTime) - +new Date();
    if (difference <= 0) return 'ENDED';
    
    const d = Math.floor(difference / (1000 * 60 * 60 * 24));
    const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const m = Math.floor((difference / 1000 / 60) % 60);
    const s = Math.floor((difference / 1000) % 60);
    
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let timer;
    if (contest) {
      setTimeLeft(calculateTimeLeft(contest.endTime));
      timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft(contest.endTime));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [contest]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
        <span className="text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">Syncing Neural Arena</span>
      </div>
    );
  }

  if (!contest) return <div className="text-center py-20">Arena not found.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="glass-card p-1 relative overflow-hidden group">
        <div className="absolute inset-0 bg-quantum-gradient opacity-10 animate-pulse" />
        <div className="relative glass-card m-0.5 p-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg">
                <span className="text-[10px] font-black text-red-400 uppercase animate-pulse">Live Arena</span>
              </div>
            </div>
            <h2 className="text-5xl font-black tracking-tighter uppercase italic">{contest.title}</h2>
            <p className="text-muted text-sm font-medium leading-relaxed max-w-xl">
              {contest.description}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                <Timer className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">{timeLeft !== 'ENDED' ? `Ending in ${timeLeft}` : 'ARENA CLOSED'}</span>
              </div>
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

      <h3 className="text-2xl font-black uppercase italic mt-12">Arena Challenges</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {contest.problems?.map((cp) => {
            const problem = cp.problem;
            const isSolved = false; // Minimal: We don't track contest-specific problem solved state visually here yet to keep it simple

            const difficultyColors = {
              Easy: 'text-green-400 bg-green-400/10 border-green-400/20',
              Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
              Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
            };

            return (
              <motion.div 
                key={problem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="glass-card p-6 flex flex-col h-full group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${difficultyColors[problem.difficulty]}`}>
                    {problem.difficulty}
                  </div>
                  <div className="text-primary font-bold text-xs">{cp.points} pts</div>
                </div>

                <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1 mb-2">
                  {problem.title}
                </h3>
                
                <p className="text-sm text-muted line-clamp-2 mb-6 flex-1">
                  {problem.description || 'Challenge your algorithmic skills with this problem.'}
                </p>

                <div className="flex items-center justify-between text-xs text-muted mb-6">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{problem.topic}</span>
                  </div>
                </div>

                <Link 
                  to={`/problems/${problem.id}?contestId=${contest.id}`}
                  className={`w-full flex items-center justify-center gap-2 py-3 border rounded-xl font-semibold transition-all ${
                    isSolved 
                      ? 'bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20' 
                      : 'bg-white/5 border-white/10 group-hover:bg-primary/10 group-hover:border-primary/50 group-hover:text-primary'
                  }`}
                >
                  {isSolved ? 'Solved' : 'Solve Challenge'}
                  {!isSolved && <ArrowUpRight className="w-4 h-4" />}
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Minimal Leaderboard */}
      <h3 className="text-2xl font-black uppercase italic mt-12">Leaderboard Preview</h3>
      <div className="glass-card p-8">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-black text-muted uppercase tracking-widest border-b border-white/5">
              <th className="pb-4 text-left px-4">Rank</th>
              <th className="pb-4 text-left px-4">Neural Unit</th>
              <th className="pb-4 text-left px-4">Score</th>
              <th className="pb-4 text-left px-4">Solved</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {contest.submissions?.slice(0, 5).map((sub, i) => (
              <tr key={sub.user.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="py-6 px-4 font-black">#{i + 1}</td>
                <td className="py-6 px-4 font-bold">{sub.user.name}</td>
                <td className="py-6 px-4 font-mono text-primary">{sub.score}</td>
                <td className="py-6 px-4">{sub.solvedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </motion.div>
  );
};

export default ContestArena;
