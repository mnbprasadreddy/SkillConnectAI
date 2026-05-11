/**
 * InterviewAnalytics — Interview history & analytics dashboard.
 * Reads from /interviews/mine — no new endpoints needed.
 * Shows aggregated scores, trends, and session history table.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, BarChart3, Eye, Mic2, Brain, Zap, ChevronRight,
  TrendingUp, Calendar, Clock
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid
} from 'recharts';
import api from '../services/api';

const StatBadge = ({ label, value, color = 'text-primary' }) => (
  <div className="glass-card p-5 text-center">
    <p className="text-[10px] text-muted uppercase font-black tracking-[0.2em] mb-1">{label}</p>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
  </div>
);

const InterviewAnalytics = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/interviews');
        // api interceptor: res.data is the paginated wrapper
        const raw = res?.data?.data || res?.data || [];
        setSessions(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error('[InterviewAnalytics] Failed to load:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  // ── Aggregate stats ──────────────────────────────────────────
  const total         = sessions.length;
  const avgConfidence = total
    ? Math.round(sessions.reduce((s, i) => s + (i.confidenceScore || 0), 0) / total)
    : 0;
  const avgScore      = total
    ? Math.round(sessions.reduce((s, i) => s + (i.score || 0), 0) / total)
    : 0;
  const avgEyeContact = total
    ? Math.round(sessions.reduce((s, i) => s + (i.analytics?.eyeContactScore || 0), 0) / total)
    : 0;

  // ── Trend data (last 6 sessions) ─────────────────────────────
  const trendData = sessions.slice(-6).map((s, idx) => ({
    name:       `S${idx + 1}`,
    Score:      s.score          || 0,
    Confidence: s.confidenceScore || 0,
    EyeContact: s.analytics?.eyeContactScore || 0,
  }));

  // ── Radar data ───────────────────────────────────────────────
  const radarData = [
    { subject: 'Overall',     A: avgScore },
    { subject: 'Confidence',  A: avgConfidence },
    { subject: 'Eye Contact', A: avgEyeContact },
    { subject: 'Technical',   A: Math.round(sessions.reduce((s, i) => s + (i.technicalScore || 0), 0) / Math.max(1, total)) },
    { subject: 'Coding',      A: Math.round(sessions.reduce((s, i) => s + (i.codingScore || 0), 0) / Math.max(1, total)) },
    { subject: 'Comm.',       A: Math.round(sessions.reduce((s, i) => s + (i.communicationScore || 0), 0) / Math.max(1, total)) },
  ];

  const typeIcon = {
    coding: '💻', behavioral: '🎤', hr: '🤝', technical: '🔬', system_design: '🏗️',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-16"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/interviews')}
            className="p-2.5 hover:bg-white/5 rounded-xl border border-white/5 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-muted group-hover:text-white transition-colors" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Interview Analytics</h1>
            <p className="text-muted text-sm mt-0.5">Career intelligence dashboard</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">{total} Sessions Total</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBadge label="Sessions"      value={total}                 color="text-white" />
        <StatBadge label="Avg Score"     value={`${avgScore}%`}        color="text-primary" />
        <StatBadge label="Avg Confidence" value={`${avgConfidence}%`}  color="text-secondary" />
        <StatBadge label="Avg Eye Contact" value={`${avgEyeContact}%`} color="text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> Skill Radar
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff08" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B949E', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="A" stroke="#00F2FE" fill="#00F2FE" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend line */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-secondary" /> Score Trends
          </h3>
          {trendData.length > 1 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="name" tick={{ fill: '#8B949E', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#8B949E', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#8B949E' }}
                  />
                  <Line type="monotone" dataKey="Score"      stroke="#00F2FE" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Confidence" stroke="#9D4EDD" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="EyeContact" stroke="#4ade80" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted text-sm">
              Complete more sessions to see trends
            </div>
          )}
        </div>
      </div>

      {/* Session history table */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Session History
        </h3>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-muted">No sessions yet. Start your first interview!</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg">
                    {typeIcon[s.interviewType] || '🎯'}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm capitalize">
                      {s.interviewType?.replace('_', ' ')} Interview
                      {s.role && <span className="text-primary text-xs ml-2">· {s.role}</span>}
                    </h5>
                    <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(s.createdAt).toLocaleDateString()}
                      <Clock className="w-3 h-3 ml-1" />
                      {Math.round((s.duration || 0) / 60)}m
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center hidden sm:block">
                    <p className="text-[10px] text-muted uppercase font-black tracking-tight">Score</p>
                    <p className="text-sm font-black text-primary">{s.score || 0}</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-[10px] text-muted uppercase font-black tracking-tight">Confidence</p>
                    <p className="text-sm font-black text-secondary">{s.confidenceScore || 0}%</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-[10px] text-muted uppercase font-black tracking-tight">Eye Contact</p>
                    <p className="text-sm font-black text-green-400">{s.analytics?.eyeContactScore || 0}%</p>
                  </div>
                  <button
                    onClick={() => navigate(`/app/interviews/analytics`)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InterviewAnalytics;
