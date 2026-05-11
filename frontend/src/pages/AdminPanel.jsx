import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Code2, 
  Trophy, 
  BookOpen, 
  FileText, 
  Server, 
  Clock,
  Crown,
  UserCog,
  Map
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { user } = useAuth();
  const role = user?.dbUser?.role;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res?.data);
      } catch (err) {
        console.error('[AdminPanel] Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const navigate = useNavigate();

  const upcomingModules = [
    { icon: Code2, label: 'Problems Management', status: 'Active', active: true, path: '/app/admin/problems' },
    { icon: Trophy, label: 'Contest Management', status: 'Active', active: true, path: '/app/admin/contests' },
    { icon: FileText, label: 'Test Case Manager', status: 'Active', active: true, path: '/app/admin/problems' },
    { icon: BookOpen, label: 'Materials Manager', status: 'Active', active: true, path: '/app/admin/materials' },
    { icon: Map, label: 'Roadmap Manager', status: 'Active', active: true, path: '/app/admin/roadmaps' },
    ...(role === 'super_admin' ? [{ icon: UserCog, label: 'Admin Access', status: 'Active', active: true, path: '/app/admin/access' }] : []),
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Control Center</h1>
            <p className="text-muted mt-1">Platform management & oversight dashboard.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">{role}</span>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'cyan' },
            { icon: ShieldCheck, label: 'Admins', value: stats.totalAdmins, color: 'amber' },
            { icon: Code2, label: 'Problems', value: stats.totalProblems, color: 'purple' },
            { icon: Server, label: 'Uptime', value: `${Math.floor(stats.serverUptime / 60)}m`, color: 'green' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 relative overflow-hidden group hover:border-white/20 transition-all"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-${stat.color === 'cyan' ? 'primary' : stat.color === 'purple' ? 'secondary' : stat.color === 'amber' ? 'amber-400' : 'green-400'}/5 blur-2xl -z-10 rounded-full`} />
              <stat.icon className={`w-5 h-5 mb-3 ${
                stat.color === 'cyan' ? 'text-primary' : 
                stat.color === 'purple' ? 'text-secondary' : 
                stat.color === 'amber' ? 'text-amber-400' : 'text-green-400'
              }`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-muted text-sm">Failed to load admin stats.</p>
      )}

      {/* Upcoming Modules */}
      <div>
        <h2 className="text-lg font-bold mb-4">Management Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingModules.map((mod, i) => (
            <motion.div
              key={mod.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              onClick={() => mod.path && navigate(mod.path)}
              className={`glass-card p-6 flex items-center justify-between group transition-all ${
                mod.active
                  ? 'hover:border-primary/30 cursor-pointer'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl border transition-all ${
                  mod.active
                    ? 'bg-primary/10 border-primary/20 group-hover:border-primary/30'
                    : 'bg-white/5 border-white/5 group-hover:border-white/10'
                }`}>
                  <mod.icon className={`w-5 h-5 transition-colors ${
                    mod.active ? 'text-primary' : 'text-muted group-hover:text-white'
                  }`} />
                </div>
                <div>
                  <p className="font-bold text-sm">{mod.label}</p>
                  <p className={`text-[10px] uppercase tracking-widest ${
                    mod.active ? 'text-primary' : 'text-muted'
                  }`}>{mod.active ? 'Manage →' : 'Coming Soon'}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-lg border ${
                mod.active
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-white/5 text-muted border-white/5'
              }`}>
                {mod.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Admin Info */}
      <div className="glass-card p-6 border-amber-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">Authorization Info</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted text-xs mb-1">Logged in as</p>
            <p className="font-bold">{user?.displayName || user?.dbUser?.name || 'Admin'}</p>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">Email</p>
            <p className="font-bold">{user?.email || user?.dbUser?.email}</p>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">Role</p>
            <p className="font-bold text-amber-400 uppercase">{role}</p>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">DB User ID</p>
            <p className="font-bold">{user?.dbUser?.id || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
