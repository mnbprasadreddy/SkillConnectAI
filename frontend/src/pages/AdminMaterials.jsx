import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Archive, ArchiveRestore, Pencil, ChevronLeft, ChevronRight,
  BookOpen, Loader2, AlertTriangle, X, Save, Link2, Youtube, FileText, Tag,
} from 'lucide-react';
import api from '../services/api';

const TOPICS = [
  'Dynamic Programming', 'Graphs', 'Arrays', 'Strings', 'Trees',
  'Linked Lists', 'Sorting', 'Hashing', 'React', 'Node.js', 'Backend',
  'AWS', 'DevOps', 'AI/ML', 'System Design', 'Databases', 'Recursion',
  'Stacks', 'Queues', 'Greedy', 'Other',
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const AdminMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [archived, setArchived] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalCount: 0 });

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '', topic: '', difficulty: 'Beginner', description: '',
    articleUrl: '', youtubeUrl: '', pdfUrl: '', tags: '',
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page, limit: pagination.limit,
        search: search || undefined, topic: topicFilter || undefined,
        archived: archived || undefined,
      };
      const res = await api.get('/admin/materials', { params });
      setMaterials(res?.data || []);
      const pg = res?.pagination;
      if (pg) setPagination(prev => ({ ...prev, totalCount: pg.totalCount || 0 }));
    } catch (err) {
      console.error('[AdminMaterials] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, topicFilter, archived]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const totalPages = Math.ceil(pagination.totalCount / pagination.limit);

  // ─── Form handlers ──────────────────────────────────────────
  const openCreateForm = () => {
    setForm({ title: '', topic: '', difficulty: 'Beginner', description: '', articleUrl: '', youtubeUrl: '', pdfUrl: '', tags: '' });
    setFormError('');
    setEditMaterial(null);
    setShowForm(true);
  };

  const openEditForm = async (materialId) => {
    try {
      const res = await api.get(`/admin/materials/${materialId}`);
      const m = res?.data;
      if (m) {
        setForm({
          title: m.title || '', topic: m.topic || '', difficulty: m.difficulty || 'Beginner',
          description: m.description || '', articleUrl: m.articleUrl || '',
          youtubeUrl: m.youtubeUrl || '', pdfUrl: m.pdfUrl || '', tags: m.tags || '',
        });
        setEditMaterial(m);
        setShowForm(true);
        setFormError('');
      }
    } catch (err) {
      console.error('[AdminMaterials] Load failed:', err);
    }
  };

  const handleFormSave = async () => {
    if (!form.title.trim()) return setFormError('Title is required');
    if (!form.topic) return setFormError('Topic is required');

    setFormSaving(true);
    setFormError('');
    try {
      if (editMaterial) {
        await api.put(`/admin/materials/${editMaterial.id}`, form);
      } else {
        await api.post('/admin/materials', form);
      }
      setShowForm(false);
      setEditMaterial(null);
      fetchMaterials();
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
      await api.patch(`/admin/materials/${archiveTarget.id}/archive`);
      setArchiveTarget(null);
      fetchMaterials();
    } catch (err) {
      console.error('[AdminMaterials] Archive failed:', err);
    } finally {
      setArchiving(false);
    }
  };

  const diffColor = (d) => {
    if (d === 'Beginner') return 'text-green-400';
    if (d === 'Intermediate') return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <BookOpen className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Material Management</h1>
            <p className="text-muted text-sm mt-0.5">{pagination.totalCount} total materials</p>
          </div>
        </div>
        <button onClick={openCreateForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary/20 border border-primary/30 text-primary font-bold text-sm rounded-xl hover:bg-primary/30 transition-all">
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            placeholder="Search materials..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors" />
        </div>
        <select value={topicFilter}
          onChange={(e) => { setTopicFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none">
          <option value="">All Topics</option>
          {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={archived}
          onChange={(e) => { setArchived(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none">
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Archived</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold">No materials found</p>
          <p className="text-sm mt-1">Create your first learning material.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">ID</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Title</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Topic</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Difficulty</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Links</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Status</th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) => (
                  <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-sm text-muted font-mono">#{m.id}</td>
                    <td className="px-5 py-3.5 text-sm font-bold max-w-[250px] truncate">{m.title}</td>
                    <td className="px-5 py-3.5 text-sm text-muted">{m.topic}</td>
                    <td className={`px-5 py-3.5 text-sm font-bold ${diffColor(m.difficulty)}`}>{m.difficulty}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {m.articleUrl && <Link2 className="w-3.5 h-3.5 text-cyan-400" title="Article" />}
                        {m.youtubeUrl && <Youtube className="w-3.5 h-3.5 text-red-400" title="YouTube" />}
                        {m.pdfUrl && <FileText className="w-3.5 h-3.5 text-amber-400" title="PDF" />}
                        {!m.articleUrl && !m.youtubeUrl && !m.pdfUrl && <span className="text-[10px] text-muted">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        m.isArchived ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                        {m.isArchived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditForm(m.id)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setArchiveTarget(m)}
                          className={`p-2 rounded-lg transition-colors ${m.isArchived ? 'hover:bg-green-500/10 text-muted hover:text-green-400' : 'hover:bg-amber-500/10 text-muted hover:text-amber-400'}`}
                          title={m.isArchived ? 'Restore' : 'Archive'}>
                          {m.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
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

      {/* Create/Edit Material Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto py-8" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-lg font-bold">{editMaterial ? 'Edit Material' : 'Create Material'}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{formError}</div>}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none" placeholder="Material title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Topic *</label>
                    <select value={form.topic} onChange={(e) => setForm(p => ({ ...p, topic: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none">
                      <option value="">Select topic...</option>
                      {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Difficulty</label>
                    <select value={form.difficulty} onChange={(e) => setForm(p => ({ ...p, difficulty: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none">
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none resize-none" placeholder="Optional description..." />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Article URL</label>
                  <input type="url" value={form.articleUrl} onChange={(e) => setForm(p => ({ ...p, articleUrl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none" placeholder="https://..." />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">YouTube URL</label>
                  <input type="url" value={form.youtubeUrl} onChange={(e) => setForm(p => ({ ...p, youtubeUrl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none" placeholder="https://youtube.com/..." />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">PDF URL</label>
                  <input type="url" value={form.pdfUrl} onChange={(e) => setForm(p => ({ ...p, pdfUrl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none" placeholder="https://..." />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Tags</label>
                  <input type="text" value={form.tags} onChange={(e) => setForm(p => ({ ...p, tags: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none" placeholder="comma, separated, tags" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                <button onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm font-bold text-muted hover:text-white rounded-xl hover:bg-white/5">Cancel</button>
                <button onClick={handleFormSave} disabled={formSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary/20 border border-primary/30 text-primary font-bold text-sm rounded-xl hover:bg-primary/30 transition-all disabled:opacity-50">
                  {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editMaterial ? 'Update' : 'Create'}
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
                <h3 className="text-lg font-bold">{archiveTarget.isArchived ? 'Restore Material?' : 'Archive Material?'}</h3>
              </div>
              <p className="text-sm text-muted mb-2"><span className="text-white font-bold">{archiveTarget.title}</span></p>
              <p className="text-sm text-muted mb-6">
                {archiveTarget.isArchived
                  ? 'This will make the material visible in recommendations and learning paths again.'
                  : 'This will hide the material from users. It will remain in the database safely.'}
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
    </div>
  );
};

export default AdminMaterials;
