import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Share2, 
  Heart, 
  Search, 
  Trophy, 
  Globe, 
  Zap,
  MoreHorizontal,
  Plus,
  BarChart3,
  Award
} from 'lucide-react';

const Community = () => {
  const [activeTab, setActiveTab] = useState('feed');

  const stats = [
    { label: 'Global Nodes', value: '124,802', icon: Globe, color: 'cyan' },
    { label: 'Sync Events', value: '52.4k', icon: Zap, color: 'purple' },
    { label: 'Neural Experts', value: '850', icon: Trophy, color: 'amber' }
  ];

  const topUsers = [
    { rank: 1, name: 'Neural_Master', score: 18450, avatar: 'NM' },
    { rank: 2, name: 'Quantum_Dev', score: 17200, avatar: 'QD' },
    { rank: 3, name: 'Logic_Ghost', score: 16850, avatar: 'LG' }
  ];

  const feedItems = [
    {
      id: 1,
      user: 'Silicon_Soul',
      time: '12m ago',
      content: 'Just finished the Neural Dynamic Programming module. The state transition mapping visualization is a game changer for Hard problems!',
      likes: 24,
      comments: 5,
      type: 'achievement'
    },
    {
      id: 2,
      user: 'Binary_Beast',
      time: '45m ago',
      content: 'Anyone interested in a collaborative System Design sync later today? Focusing on Global Consistency vs Latency trade-offs.',
      likes: 12,
      comments: 18,
      type: 'discussion'
    },
    {
      id: 3,
      user: 'Neural_Explorer',
      time: '2h ago',
      content: 'Achieved 98% confidence score in my Mock Interview today. Consistency is key. Practice with the biometrics HUD really helps.',
      likes: 56,
      comments: 12,
      type: 'status'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic italic">Neural Network</h1>
          <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">Global collective intelligence and synchronization stream</p>
        </div>
        <button className="neon-button-cyan px-8 py-3 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Initialize Post
        </button>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const colorMap = {
            cyan: 'text-cyan-400 group-hover:shadow-neon-cyan',
            purple: 'text-purple-400 group-hover:shadow-neon-purple',
            amber: 'text-amber-400 group-hover:shadow-neon-purple',
          };
          return (
            <div key={i} className="glass-card p-8 flex items-center gap-6 group hover:border-primary/20 transition-all">
              <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 transition-all ${colorMap[stat.color] || colorMap.cyan}`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Navigation & Leaderboard */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card p-6 space-y-1">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'feed' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted hover:bg-white/5 border border-transparent'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Global Stream</span>
            </button>
            <button 
              onClick={() => setActiveTab('trending')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'trending' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted hover:bg-white/5 border border-transparent'}`}
            >
              <Zap className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Trending Nodes</span>
            </button>
            <button 
              onClick={() => setActiveTab('ranking')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ranking' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted hover:bg-white/5 border border-transparent'}`}
            >
              <Award className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Top Contributors</span>
            </button>
          </div>

          <div className="glass-card p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted mb-6">Neural Leaderboard</h3>
            <div className="space-y-6">
              {topUsers.map((u) => (
                <div key={u.rank} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black group-hover:border-primary/50 transition-all">
                      {u.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">{u.name}</p>
                      <p className="text-[10px] text-muted font-bold uppercase">{u.score.toLocaleString()} Points</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${u.rank === 1 ? 'text-amber-400' : u.rank === 2 ? 'text-slate-400' : 'text-amber-700'}`}>#{u.rank}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Feed Stream */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search/Filter Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                type="text" 
                placeholder="Search the Neural Network..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold outline-none focus:border-primary/50 transition-all"
              />
            </div>
            <button className="px-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
              <MoreHorizontal className="w-5 h-5 text-muted" />
            </button>
          </div>

          {/* Feed Content */}
          <div className="space-y-6">
            {feedItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 space-y-6 group hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center text-xs font-black">
                      {item.user.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold hover:text-primary cursor-pointer transition-colors">{item.user}</p>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{item.time}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
                    item.type === 'achievement' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    item.type === 'discussion' ? 'bg-primary/10 border-primary/20 text-primary' :
                    'bg-secondary/10 border-secondary/20 text-secondary'
                  }`}>
                    {item.type}
                  </div>
                </div>

                <p className="text-sm font-medium leading-relaxed text-white/90">
                  {item.content}
                </p>

                <div className="flex items-center gap-8 pt-2">
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-red-400 transition-colors group/btn">
                    <Heart className="w-4 h-4 group-hover/btn:fill-current" />
                    {item.likes} Neural Pulses
                  </button>
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    {item.comments} Responses
                  </button>
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-secondary transition-colors ml-auto">
                    <Share2 className="w-4 h-4" />
                    Propagate
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Load More Trigger */}
            <div className="py-10 flex flex-col items-center justify-center space-y-4 opacity-40 hover:opacity-100 transition-all cursor-pointer">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
               <p className="text-[10px] font-black text-muted uppercase tracking-[0.5em]">Synchronizing Future Fragments</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Community;
