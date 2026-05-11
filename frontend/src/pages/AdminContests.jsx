import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Archive, ArchiveRestore, Pencil, ChevronLeft, ChevronRight,
  Trophy, Loader2, AlertTriangle, X, Calendar, Clock, Save, Trash2, Code2,
} from 'lucide-react';
import api from '../services/api';

const AdminContests = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalCount: 0 });

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editContest, setEditContest] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  // Problem assignment
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignProblems, setAssignProblems] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [newProblemId, setNewProblemId] = useState('');
  const [newProblemPoints, setNewProblemPoints] = useState(100);

  // Available problems for assignment
  const [availableProblems, setAvailableProblems] = useState([]);

  const fetchContests = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page, limit: pagination.limit,
        search: search || undefined, archived: archived || undefined,
      };
      const res = await api.get('/admin/contests', { params });
      setContests(res?.data || []);
      const pg = res?.pagination;
      if (pg) setPagination(prev => ({ ...prev, totalCount: pg.totalCount || 0 }));
    } catch (err) {
      console.error('[AdminContests] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, archived]);

  useEffect(() => { fetchContests(); }, [fetchContests]);

  // Fetch available problems for assignment dropdown
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await api.get('/admin/problems', { params: { limit: 50, archived: 'false' } });
        setAvailableProblems(res?.data || []);
      } catch (err) {
        console.error('[AdminContests] Failed to fetch problems:', err);
      }
    };
    fetchProblems();
  }, []);

  const totalPages = Math.ceil(pagination.totalCount / pagination.limit);

  const statusColor = (s) => {
    if (s === 'active') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (s === 'upcoming') return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    return 'text-muted bg-white/5 border-white/10';
  };

  // ─── Form state ────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '', description: '', difficulty: 'Mixed', startTime: '', endTime: '', problemIds: [],
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openCreateForm = () => {
    setForm({ title: '', description: '', difficulty: 'Mixed', startTime: '', endTime: '', problemIds: [] });
    setFormError('');
    setShowForm(true);
    setEditContest(null);
  };

  const openEditForm = async (contestId) => {
    try {
      const res = await api.get(`/admin/contests/${contestId}`);
      const c = res?.data;
      if (c) {
        setForm({
          title: c.title || '',
          description: c.description || '',
          difficulty: c.difficulty || 'Mixed',
          startTime: c.startTime ? new Date(c.startTime).toISOString().slice(0, 16) : '',
          endTime: c.endTime ? new Date(c.endTime).toISOString().slice(0, 16) : '',
          problemIds: [],
        });
        setEditContest(c);
        setShowForm(true);
        setFormError('');
      }
    } catch (err) {
      console.error('[AdminContests] Failed to load contest:', err);
    }
  };

  const handleFormSave = async () => {
    if (!form.title.trim()) return setFormError('Title is required');
    if (!form.startTime) return setFormError('Start time is required');
    if (!form.endTime) return setFormError('End time is required');

    setFormSaving(true);
    setFormError('');
    try {
      if (editContest) {
        await api.put(`/admin/contests/${editContest.id}`, form);
      } else {
        await api.post('/admin/contests', form);
      }
      setShowForm(false);
      setEditContest(null);
      fetchContests();
    } catch (err) {
      setFormError(err?.response?.data?.error || err?.message || 'Failed to save');
    } finally {
      setFormSaving(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await api.patch(`/admin/contests/${archiveTarget.id}/archive`);
      setArchiveTarget(null);
      fetchContests();
    } catch (err) {
      console.error('[AdminContests] Archive failed:', err);
    } finally {
      setArchiving(false);
    }
  };

  // ─── Problem assignment ────────────────────────────────────────
  const openAssign = async (contestId) => {
    setAssignLoading(true);
    try {
      const res = await api.get(`/admin/contests/${contestId}`);
      setAssignTarget(res?.data);
      setAssignProblems(res?.data?.problems || []);
    } catch (err) {
      console.error('[AdminContests] Failed to load contest problems:', err);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAddProblem = async () => {
    if (!newProblemId || !assignTarget) return;
    try {
      await api.post(`/admin/contests/${assignTarget.id}/problems`, {
        problemId: parseInt(newProblemId), points: parseInt(newProblemPoints) || 100,
      });
      setNewProblemId('');
      setNewProblemPoints(100);
      const res = await api.get(`/admin/contests/${assignTarget.id}`);
      setAssignTarget(res?.data);
      setAssignProblems(res?.data?.problems || []);
      fetchContests();
    } catch (err) {
      console.error('[AdminContests] Add problem failed:', err);
    }
  };

  const handleRemoveProblem = async (problemId) => {
    if (!assignTarget) return;
    try {
      await api.delete(`/admin/contests/${assignTarget.id}/problems/${problemId}`);
      const res = await api.get(`/admin/contests/${assignTarget.id}`);
      setAssignTarget(res?.data);
      setAssignProblems(res?.data?.problems || []);
      fetchContests();
    } catch (err) {
      console.error('[AdminContests] Remove problem failed:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contest Management</h1>
            <p className="text-muted text-sm mt-0.5">{pagination.totalCount} total contests</p>
          </div>
        </div>
        <button onClick={openCreateForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary/20 border border-primary/30 text-primary font-bold text-sm rounded-xl hover:bg-primary/30 transition-all"
        >
          <Plus className="w-4 h-4" /> New Contest
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            placeholder="Search contests..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors"
          />
        </div>
        <select value={archived}
          onChange={(e) => { setArchived(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Archived</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
        </div>
      ) : contests.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold">No contests found</p>
          <p className="text-sm mt-1">Create your first contest.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">ID</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Title</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Difficulty</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Status</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Problems</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Participants</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Archive</th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contests.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm text-muted font-mono">#{c.id}</td>
                    <td className="px-5 py-3.5 text-sm font-bold max-w-[200px] truncate">{c.title}</td>
                    <td className="px-5 py-3.5 text-sm text-muted">{c.difficulty}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-center text-muted">{c._count?.problems || 0}</td>
                    <td className="px-5 py-3.5 text-sm text-center text-muted">{c._count?.submissions || 0}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        c.isArchived ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                        {c.isArchived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openAssign(c.id)} className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors text-muted hover:text-purple-400" title="Manage Problems">
                          <Code2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEditForm(c.id)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setArchiveTarget(c)}
                          className={`p-2 rounded-lg transition-colors ${c.isArchived ? 'hover:bg-green-500/10 text-muted hover:text-green-400' : 'hover:bg-amber-500/10 text-muted hover:text-amber-400'}`}
                          title={c.isArchived ? 'Restore' : 'Archive'}
                        >
                          {c.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>
                      </div>
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

      {/* Create/Edit Contest Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-lg font-bold">{editContest ? 'Edit Contest' : 'Create Contest'}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{formError}</div>}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none" placeholder="Contest title" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none resize-none" placeholder="Optional description..." />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => setForm(p => ({ ...p, difficulty: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none">
                    <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option><option value="Mixed">Mixed</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Start Time *</label>
                    <input type="datetime-local" value={form.startTime} onChange={(e) => setForm(p => ({ ...p, startTime: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">End Time *</label>
                    <input type="datetime-local" value={form.endTime} onChange={(e) => setForm(p => ({ ...p, endTime: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                <button onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm font-bold text-muted hover:text-white rounded-xl hover:bg-white/5">Cancel</button>
                <button onClick={handleFormSave} disabled={formSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary/20 border border-primary/30 text-primary font-bold text-sm rounded-xl hover:bg-primary/30 transition-all disabled:opacity-50">
                  {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editContest ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Archive Confirmation */}
      <AnimatePresence>
        {archiveTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setArchiveTarget(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${archiveTarget.isArchived ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                  {archiveTarget.isArchived ? <ArchiveRestore className="w-6 h-6 text-green-400" /> : <AlertTriangle className="w-6 h-6 text-amber-400" />}
                </div>
                <h3 className="text-lg font-bold">{archiveTarget.isArchived ? 'Restore Contest?' : 'Archive Contest?'}</h3>
              </div>
              <p className="text-sm text-muted mb-2"><span className="text-white font-bold">{archiveTarget.title}</span></p>
              <p className="text-sm text-muted mb-6">
                {archiveTarget.isArchived
                  ? 'This will make the contest visible to users again.'
                  : 'This will hide the contest from users. All rankings and submissions are preserved.'}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setArchiveTarget(null)} className="px-5 py-2.5 text-sm font-bold text-muted hover:text-white rounded-xl hover:bg-white/5">Cancel</button>
                <button onClick={handleArchiveToggle} disabled={archiving}
                  className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all disabled:opacity-50 ${
                    archiveTarget.isArchived ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                  }`}>
                  {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : archiveTarget.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  {archiveTarget.isArchived ? 'Restore' : 'Archive'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Problem Assignment Modal */}
      <AnimatePresence>
        {assignTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto py-8" onClick={() => setAssignTarget(null)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold">Contest Problems</h2>
                  <p className="text-xs text-muted mt-0.5">{assignTarget.title}</p>
                </div>
                <button onClick={() => setAssignTarget(null)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-3">
                {assignTarget.problems?.length === 0 ? (
                  <p className="text-center text-muted py-6">No problems assigned yet.</p>
                ) : (
                  assignTarget.problems?.map((cp) => (
                    <div key={cp.id} className="flex items-center justify-between border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                      <div>
                        <p className="text-sm font-bold">{cp.problem?.title}</p>
                        <p className="text-[10px] text-muted mt-0.5">{cp.problem?.difficulty} · {cp.points} pts</p>
                      </div>
                      <button onClick={() => handleRemoveProblem(cp.problem?.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-400 transition-colors" title="Remove from contest">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Problem */}
              <div className="p-6 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Assign Problem</p>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted/60 mb-1 block">Problem</label>
                    <select value={newProblemId} onChange={(e) => setNewProblemId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-primary/50 focus:outline-none">
                      <option value="">Select a problem...</option>
                      {availableProblems.map(p => (
                        <option key={p.id} value={p.id}>#{p.id} — {p.title} ({p.difficulty})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted/60 mb-1 block">Points</label>
                    <input type="number" value={newProblemPoints} onChange={(e) => setNewProblemPoints(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-primary/50 focus:outline-none" />
                  </div>
                  <button onClick={handleAddProblem} disabled={!newProblemId}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold text-xs rounded-xl hover:bg-purple-500/30 transition-all disabled:opacity-50">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminContests;
