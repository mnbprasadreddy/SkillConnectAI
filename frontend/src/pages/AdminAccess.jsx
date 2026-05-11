import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronLeft, ChevronRight, Shield, ShieldCheck, ShieldAlert,
  Loader2, AlertTriangle, X, UserCog, Users, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminAccess = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalCount: 0 });

  // Role change modal
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page, limit: pagination.limit,
        search: search || undefined, role: roleFilter || undefined,
      };
      const res = await api.get('/admin/users', { params });
      setUsers(res?.data || []);
      const pg = res?.pagination;
      if (pg) setPagination(prev => ({ ...prev, totalCount: pg.totalCount || 0 }));
    } catch (err) {
      console.error('[AdminAccess] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(pagination.totalCount / pagination.limit);

  const openRoleChange = (user) => {
    setRoleTarget(user);
    setNewRole(user.role);
    setChangeError('');
  };

  const handleRoleChange = async () => {
    if (!roleTarget || !newRole || newRole === roleTarget.role) return;
    setChanging(true);
    setChangeError('');
    try {
      await api.patch(`/admin/users/${roleTarget.id}/role`, { role: newRole });
      setRoleTarget(null);
      fetchUsers();
    } catch (err) {
      setChangeError(err?.response?.data?.error || err?.message || 'Failed to update role');
    } finally {
      setChanging(false);
    }
  };

  const roleColors = {
    user: 'text-muted bg-white/5 border-white/10',
    admin: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    super_admin: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  const roleIcon = (role) => {
    if (role === 'super_admin') return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
    if (role === 'admin') return <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />;
    return <Shield className="w-3.5 h-3.5 text-muted" />;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
          <UserCog className="w-7 h-7 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Access Management</h1>
          <p className="text-muted text-sm mt-0.5">{pagination.totalCount} registered users · Super Admin Only</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="glass-card p-4 border-amber-500/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-400">Security Notice</p>
          <p className="text-xs text-muted mt-1">
            Only <span className="text-amber-400 font-bold">super_admin</span> can change user roles.
            You cannot demote yourself or remove the last super admin.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors" />
        </div>
        <select value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold">No users found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">ID</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Name</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Email</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Role</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Skill</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Streak</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Joined</th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-sm text-muted font-mono">#{u.id}</td>
                    <td className="px-5 py-3.5 text-sm font-bold">{u.name}</td>
                    <td className="px-5 py-3.5 text-sm text-muted">{u.email}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${roleColors[u.role] || roleColors.user}`}>
                        {roleIcon(u.role)} {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-center text-muted capitalize">{u.skillLevel}</td>
                    <td className="px-5 py-3.5 text-sm text-center text-muted">{u.streak}d</td>
                    <td className="px-5 py-3.5 text-sm text-center text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      {u.id !== currentUser?.dbUser?.id ? (
                        <button onClick={() => openRoleChange(u)}
                          className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-muted hover:text-cyan-400" title="Change Role">
                          <UserCog className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted/40 font-bold">YOU</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page <= 1}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm text-muted">Page <span className="text-white font-bold">{pagination.page}</span> of <span className="text-white font-bold">{totalPages}</span></span>
          <button onClick={() => setPagination(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))} disabled={pagination.page >= totalPages}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
        </div>
      )}

      {/* Role Change Modal */}
      <AnimatePresence>
        {roleTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setRoleTarget(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl p-8 max-w-md mx-4 shadow-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Change User Role</h3>
                <button onClick={() => setRoleTarget(null)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div className="glass-card p-4">
                  <p className="text-sm font-bold">{roleTarget.name}</p>
                  <p className="text-xs text-muted">{roleTarget.email}</p>
                  <p className="text-xs text-muted mt-1">Current role: <span className="text-white font-bold">{roleTarget.role}</span></p>
                </div>

                {changeError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{changeError}</div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">New Role</label>
                  <div className="space-y-2">
                    {[
                      { value: 'user', label: 'User', desc: 'Standard platform access', icon: Shield, color: 'border-white/10 hover:border-white/20' },
                      { value: 'admin', label: 'Admin', desc: 'Can manage problems, contests, materials', icon: ShieldCheck, color: 'border-cyan-500/20 hover:border-cyan-500/40' },
                      { value: 'super_admin', label: 'Super Admin', desc: 'Full platform control + access management', icon: ShieldAlert, color: 'border-amber-500/20 hover:border-amber-500/40' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setNewRole(opt.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          newRole === opt.value ? `${opt.color} bg-white/5` : 'border-white/5 bg-white/[0.01]'
                        }`}>
                        <opt.icon className={`w-5 h-5 ${newRole === opt.value ? (opt.value === 'super_admin' ? 'text-amber-400' : opt.value === 'admin' ? 'text-cyan-400' : 'text-muted') : 'text-muted/40'}`} />
                        <div>
                          <p className={`text-sm font-bold ${newRole === opt.value ? 'text-white' : 'text-muted'}`}>{opt.label}</p>
                          <p className="text-[10px] text-muted/60">{opt.desc}</p>
                        </div>
                        {newRole !== roleTarget.role && newRole === opt.value && (
                          <span className="ml-auto">
                            {['user', 'admin', 'super_admin'].indexOf(opt.value) > ['user', 'admin', 'super_admin'].indexOf(roleTarget.role)
                              ? <ArrowUpRight className="w-4 h-4 text-green-400" />
                              : <ArrowDownRight className="w-4 h-4 text-red-400" />
                            }
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button onClick={() => setRoleTarget(null)} className="px-5 py-2.5 text-sm font-bold text-muted hover:text-white rounded-xl hover:bg-white/5">Cancel</button>
                <button onClick={handleRoleChange} disabled={changing || newRole === roleTarget.role}
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold text-sm rounded-xl hover:bg-cyan-500/30 transition-all disabled:opacity-50">
                  {changing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCog className="w-4 h-4" />}
                  Update Role
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAccess;
