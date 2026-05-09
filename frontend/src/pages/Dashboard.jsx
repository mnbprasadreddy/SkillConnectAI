import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Target, 
  Flame, 
  Zap, 
  ChevronRight,
  BrainCircuit,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashResponse, recsResponse, codingResponse] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/recommendations'),
          api.get('/analytics/coding')
        ]);
        
        const dashboardData = dashResponse.data || {};
        const codingData = codingResponse.data || {};
        const recsData = Array.isArray(recsResponse.data) ? recsResponse.data : [];

        console.log('[SafeDebug] Dashboard Hydrated:', dashboardData);
        
        // Merge coding stats into dashboard stats for the charts
        if (codingData && dashboardData?.stats) {
          dashboardData.stats.submissionTrend = codingData.submissionTrend;
          
          const diffBreakdown = {};
          if (codingData.difficultyBreakdown) {
            codingData.difficultyBreakdown.forEach(d => {
              diffBreakdown[d.difficulty] = d.problemsSolved;
            });
          }
          dashboardData.stats.problemsSolvedByDifficulty = diffBreakdown;
        }
        
        setData(dashboardData);
        setRecommendations(recsData);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[400px] bg-white/5 rounded-2xl" />
          <div className="h-[400px] bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  const activityData = data?.stats?.submissionTrend || [
    { date: 'Mon', accepted: 0 },
    { date: 'Tue', accepted: 0 },
    { date: 'Wed', accepted: 0 },
    { date: 'Thu', accepted: 0 },
    { date: 'Fri', accepted: 0 },
    { date: 'Sat', accepted: 0 },
    { date: 'Sun', accepted: 0 },
  ];

  const difficultyData = [
    { name: 'Easy', value: data?.stats?.problemsSolvedByDifficulty?.Easy || 0, color: '#00F2FE' },
    { name: 'Medium', value: data?.stats?.problemsSolvedByDifficulty?.Medium || 0, color: '#7000FF' },
    { name: 'Hard', value: data?.stats?.problemsSolvedByDifficulty?.Hard || 0, color: '#F59E0B' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, <span className="text-primary">{user?.displayName?.split(' ')[0] || data?.user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-muted mt-1">Your neural progression is performing at peak capacity.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <p className="text-xs font-medium text-muted mr-2">Network Online</p>
          </div>
          <button className="neon-button-cyan py-2 px-4 text-xs font-bold uppercase tracking-wider">Start Practice</button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Target} 
          label="Problems Solved" 
          value={data?.stats?.problemsSolved ?? user?.problemsSolved ?? 0} 
          trend={`${data?.stats?.completionRate ?? 0}% Total`} 
          color="cyan" 
        />
        <StatCard 
          icon={Flame} 
          label="Current Streak" 
          value={`${data?.user?.streak ?? user?.streak ?? 0} Days`} 
          trend="Level 1" 
          color="orange" 
        />
        <StatCard 
          icon={Zap} 
          label="Accuracy" 
          value={`${data?.stats?.accuracy ?? user?.accuracy ?? 0}%`} 
          trend="Verified" 
          color="purple" 
        />
        <StatCard 
          icon={Trophy} 
          label="Interviews" 
          value={data?.stats?.completedInterviews ?? 0} 
          trend="Sessions" 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-card p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 rounded-full" />
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Solving Velocity
              </h3>
              <p className="text-sm text-muted">Neural stream accepted submissions</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00F2FE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#8B949E" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis 
                  stroke="#8B949E" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00F2FE' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="accepted" 
                  stroke="#00F2FE" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSolved)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="glass-card p-8 flex flex-col relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 blur-[80px] -z-10 rounded-full" />
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="text-xl font-bold">Neural Insights</h3>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {recommendations.length > 0 ? recommendations.slice(0, 4).map((rec, i) => (
              <motion.div 
                key={rec.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-black text-secondary/80">
                    {rec.type.replace('_', ' ')}
                  </span>
                  <Clock className="w-3 h-3 text-muted" />
                </div>
                <p className="text-sm font-medium leading-relaxed group-hover:text-primary transition-colors">
                  {rec.content.message}
                </p>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
                <AlertCircle className="w-8 h-8 text-muted/30" />
                <p className="text-xs text-muted italic">Generating intelligent progression path...</p>
              </div>
            )}
          </div>

          <button className="w-full mt-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-black text-primary hover:bg-primary/5 p-3 rounded-xl transition-all border border-primary/20">
            Expand Intelligence
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Difficulty Breakdown */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-secondary" />
            Skill Distribution
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="#8B949E" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#8B949E" />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {difficultyData.map(d => (
              <div key={d.name} className="text-center">
                <p className="text-[10px] text-muted uppercase font-bold">{d.name}</p>
                <p className="text-sm font-bold" style={{ color: d.color }}>{d.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Operations
          </h3>
          <div className="space-y-4">
            {data?.recentSubmissions?.length > 0 ? data.recentSubmissions.map((sub, i) => (
              <motion.div 
                key={sub.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${sub.result === 'accepted' ? 'bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 text-red-400'}`}>
                    {sub.result === 'accepted' ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{sub.problem}</h4>
                    <p className="text-[10px] text-muted uppercase font-bold tracking-wider">
                      {formatDistanceToNow(new Date(sub.date))} ago • {sub.language}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-primary">{sub.runtime || '0'}ms</p>
                  <p className="text-[10px] uppercase text-muted font-black tracking-widest">{sub.difficulty}</p>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-sm text-muted italic">No neural operations recorded in the current cycle.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
