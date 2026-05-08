import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Activity, 
  Brain, 
  Award,
  Clock,
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart2,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../services/api';
import StatCard from '../components/StatCard';

const Analytics = () => {
  const [codingStats, setCodingStats] = useState(null);
  const [interviewStats, setInterviewStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [codingRes, interviewRes] = await Promise.all([
          api.get('/analytics/coding'),
          api.get('/analytics/interview')
        ]);
        setCodingStats(codingRes.data);
        setInterviewStats(interviewRes.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
        <span className="text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">Synchronizing Neural Metrics</span>
      </div>
    );
  }

  const verdictData = codingStats ? Object.entries(codingStats.verdicts).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  })) : [];

  const COLORS = ['#00F2FE', '#8E2DE2', '#FF8A00', '#00FF87', '#FF4E50'];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic italic">Neural Analytics</h1>
          <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">Deep-dive into your performance architecture</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">Last 30 Days</span>
          </div>
        </div>
      </div>

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={TrendingUp} 
          label="Submission Accuracy" 
          value={`${Math.round(codingStats?.acceptedSubmissions / codingStats?.totalSubmissions * 100) || 0}%`} 
          trend="+5.2%" 
          color="cyan" 
        />
        <StatCard 
          icon={Target} 
          label="Problems Solved" 
          value={codingStats?.problemsSolved || 0} 
          trend="Top 12%" 
          color="purple" 
        />
        <StatCard 
          icon={Brain} 
          label="Avg Interview Score" 
          value={`${Math.round(interviewStats?.averageScore) || 0}%`} 
          trend="Consistent" 
          color="orange" 
        />
        <StatCard 
          icon={Zap} 
          label="Neural Stability" 
          value={`${Math.round(interviewStats?.averageConfidence) || 0}%`} 
          trend="Optimal" 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coding Trend */}
        <div className="lg:col-span-2 glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" /> 
              <span className="uppercase tracking-tight">Submission Flux</span>
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={codingStats?.submissionTrend}>
                <defs>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00F2FE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8B949E', fontSize: 10, fontWeight: 'bold' }} 
                  tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8B949E', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="accepted" stroke="#00F2FE" fillOpacity={1} fill="url(#colorAccepted)" strokeWidth={3} />
                <Area type="monotone" dataKey="total" stroke="#8E2DE2" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verdict Distribution */}
        <div className="glass-card p-8 flex flex-col">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <PieChartIcon className="w-5 h-5 text-secondary" /> 
            <span className="uppercase tracking-tight">Execution Verdicts</span>
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verdictData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {verdictData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {verdictData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[9px] font-black uppercase text-muted truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Topic Performance */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-primary" /> 
            <span className="uppercase tracking-tight">Topic Proficiency</span>
          </h3>
          <div className="space-y-6">
            {codingStats?.topicPerformance?.slice(0, 6).map((topic, i) => (
              <div key={topic.topic} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest">{topic.topic}</span>
                  <span className="text-xs font-black text-primary">{topic.accuracy}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.accuracy}%` }}
                    className="h-full bg-quantum-gradient shadow-neon-cyan"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interview Trends */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <Award className="w-5 h-5 text-secondary" /> 
            <span className="uppercase tracking-tight">Interview Evolution</span>
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={interviewStats?.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  hide
                />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#8B949E', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="score" stroke="#8E2DE2" strokeWidth={3} dot={{ fill: '#8E2DE2', r: 4 }} activeDot={{ r: 6, stroke: '#8E2DE2', strokeWidth: 2, fill: '#fff' }} />
                <Line type="monotone" dataKey="confidenceScore" stroke="#00F2FE" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Top Strength</p>
              <p className="text-sm font-black text-green-400 uppercase">Communication</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Growth Area</p>
              <p className="text-sm font-black text-orange-400 uppercase">System Design</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
