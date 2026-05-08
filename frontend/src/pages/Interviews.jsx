import React, { useState, useEffect } from 'react';
import { 
  Mic2, 
  Video, 
  History, 
  BarChart3, 
  Plus, 
  Brain,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import StatCard from '../components/StatCard';
import api from '../services/api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Interviews = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const interviewTypes = [
    { id: 'behavioral', label: 'Behavioral', icon: MessageSquare, color: 'cyan', desc: 'Focus on STAR method and soft skills.' },
    { id: 'technical', label: 'Technical', icon: Brain, color: 'purple', desc: 'Core fundamentals and concept deep-dives.' },
    { id: 'system_design', label: 'System Design', icon: BarChart3, color: 'orange', desc: 'Scalability, architecture, and tradeoffs.' },
    { id: 'coding', label: 'Live Coding', icon: Video, color: 'green', desc: 'Problem solving with real-time feedback.' },
  ];

  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        setLoading(true);
        const [historyRes, statsRes] = await Promise.all([
          api.get('/interviews/mine'),
          api.get('/analytics/interview')
        ]);
        setHistory(historyRes.data);
        setStats(statsRes);
      } catch (err) {
        console.error('Failed to fetch interview data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviewData();
  }, []);

  const startInterview = (type) => {
    navigate(`/interviews/setup?type=${type}`);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">AI Interview Hub</h1>
          <p className="text-muted mt-1">Master your communication with our advanced neural interviewer.</p>
        </div>
        <button 
          onClick={() => startInterview('behavioral')}
          className="neon-button-cyan flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Quick Start
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Mic2} 
          label="Interviews Completed" 
          value={stats?.totalInterviews || 0} 
          trend="+2 this week" 
          color="cyan" 
        />
        <StatCard 
          icon={ShieldAlert} 
          label="Avg Confidence" 
          value={`${stats?.averageConfidence || 0}%`} 
          trend="Increasing" 
          color="purple" 
        />
        <StatCard 
          icon={History} 
          label="Practice Time" 
          value={`${Math.round((stats?.totalDuration || 0) / 60)}m`} 
          trend="Total" 
          color="orange" 
        />
        <StatCard 
          icon={BarChart3} 
          label="Overall Readiness" 
          value="74%" 
          trend="Good" 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Interview Types */}
          <section>
            <h3 className="text-xl font-bold mb-6">Select Neural Training Path</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviewTypes.map((type) => {
                const colorMap = {
                  cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:shadow-neon-cyan',
                  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:shadow-neon-purple',
                  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400 group-hover:shadow-neon-purple',
                  green: 'bg-green-500/10 border-green-500/20 text-green-400 group-hover:shadow-neon-cyan',
                };
                return (
                  <motion.div 
                    key={type.id}
                    whileHover={{ y: -5 }}
                    onClick={() => startInterview(type.id)}
                    className="glass-card p-6 flex items-start gap-5 cursor-pointer group"
                  >
                    <div className={`p-4 rounded-2xl border transition-all ${colorMap[type.color] || colorMap.cyan}`}>
                      <type.icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-1">{type.label}</h4>
                      <p className="text-sm text-muted leading-relaxed mb-4">{type.desc}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        INITIALIZE SESSION <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* History */}
          <section className="glass-card p-8">
            <h3 className="text-xl font-bold mb-6">Experience History</h3>
            <div className="space-y-4">
              {history.length > 0 ? (
                history.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-muted" />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm capitalize">{session.interviewType} Interview</h5>
                        <p className="text-xs text-muted">{new Date(session.createdAt).toLocaleDateString()} • {Math.round(session.duration / 60)} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-[10px] text-muted uppercase font-bold tracking-tighter">Confidence</p>
                        <p className="text-sm font-bold text-primary">{session.confidenceScore || 0}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted uppercase font-bold tracking-tighter">Score</p>
                        <p className="text-sm font-bold">{session.score || 0}/100</p>
                      </div>
                      <button 
                        onClick={() => navigate(`/app/interviews/report/${session.id}`)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted">
                  <p>No historical sessions found in your neural logs.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: AI Recommendations */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-secondary/20">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-secondary shadow-neon-purple" />
              <h4 className="font-bold">AI Coach</h4>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-6">
              "Based on your last session, you should focus on your eye contact stability and reducing filler words like 'um' and 'basically'."
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Eye Contact</span>
                <span className="text-secondary font-bold">65%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-secondary shadow-neon-purple" />
              </div>
              
              <div className="flex items-center justify-between text-xs mt-4">
                <span className="text-muted">Communication</span>
                <span className="text-primary font-bold">82%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[82%] bg-primary shadow-neon-cyan" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h4 className="font-bold mb-4">Coming Up</h4>
            <div className="space-y-4">
              <div className="flex gap-3 text-xs">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <div>
                  <p className="font-bold">Mock System Design</p>
                  <p className="text-muted">Today, 4:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interviews;
