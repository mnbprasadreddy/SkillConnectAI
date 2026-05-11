import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Code2,
  Filter,
  Loader2,
  AlertTriangle,
  FlaskConical,
  Eye,
  EyeOff,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import api from '../services/api';
import AdminProblemForm from '../components/AdminProblemForm';

const AdminProblems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [archived, setArchived] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalCount: 0 });

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editProblem, setEditProblem] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  // Test case management state
  const [tcProblem, setTcProblem] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [tcLoading, setTcLoading] = useState(false);
  const [tcAdding, setTcAdding] = useState(false);
  const [newTc, setNewTc] = useState({ input: '', expectedOutput: '', isHidden: false });

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        difficulty: difficulty || undefined,
        archived: archived || undefined,
      };
      const res = await api.get('/admin/problems', { params });
      setProblems(res?.data || []);
      const pg = res?.pagination;
      if (pg) {
        setPagination(prev => ({ ...prev, totalCount: pg.totalCount || 0 }));
      }
    } catch (err) {
      console.error('[AdminProblems] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, difficulty, archived]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleCreate = async (formData) => {
    await api.post('/admin/problems', formData);
    setShowForm(false);
    fetchProblems();
  };

  const handleEdit = async (formData) => {
    await api.put(`/admin/problems/${editProblem.id}`, formData);
    setEditProblem(null);
    fetchProblems();
  };

  const handleOpenEdit = async (problemId) => {
    try {
      const res = await api.get(`/admin/problems/${problemId}`);
      setEditProblem(res?.data);
    } catch (err) {
      console.error('[AdminProblems] Failed to load problem for edit:', err);
    }
  };

  const handleArchiveToggle = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await api.patch(`/admin/problems/${archiveTarget.id}/archive`);
      setArchiveTarget(null);
      fetchProblems();
    } catch (err) {
      console.error('[AdminProblems] Archive failed:', err);
    } finally {
      setArchiving(false);
    }
  };

  // ─── Test Case handlers ──────────────────────────────────────
  const openTestCases = async (problem) => {
    setTcProblem(problem);
    setTcLoading(true);
    try {
      const res = await api.get(`/admin/problems/${problem.id}/testcases`);
      setTestCases(res?.data || []);
    } catch (err) {
      console.error('[AdminProblems] Failed to load test cases:', err);
    } finally {
      setTcLoading(false);
    }
  };

  const handleAddTestCase = async () => {
    if (!newTc.input.trim() || !newTc.expectedOutput.trim()) return;
    setTcAdding(true);
    try {
      await api.post(`/admin/problems/${tcProblem.id}/testcases`, newTc);
      setNewTc({ input: '', expectedOutput: '', isHidden: false });
      const res = await api.get(`/admin/problems/${tcProblem.id}/testcases`);
      setTestCases(res?.data || []);
      fetchProblems();
    } catch (err) {
      console.error('[AdminProblems] Add test case failed:', err);
    } finally {
      setTcAdding(false);
    }
  };

  const handleArchiveTestCase = async (tcId) => {
    try {
      await api.patch(`/admin/testcases/${tcId}/archive`);
      const res = await api.get(`/admin/problems/${tcProblem.id}/testcases`);
      setTestCases(res?.data || []);
      fetchProblems();
    } catch (err) {
      console.error('[AdminProblems] Archive test case failed:', err);
    }
  };

  const totalPages = Math.ceil(pagination.totalCount / pagination.limit);

  const difficultyColor = (d) => {
    if (d === 'Easy') return 'text-green-400';
    if (d === 'Medium') return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
            <Code2 className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Problem Management</h1>
            <p className="text-muted text-sm mt-0.5">{pagination.totalCount} total problems in database</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary/20 border border-primary/30 text-primary font-bold text-sm rounded-xl hover:bg-primary/30 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Problem
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            placeholder="Search problems..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none transition-colors"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => { setDifficulty(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select
          value={archived}
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
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <Code2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold">No problems found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new problem.</p>
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
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Topic</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Tests</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Submissions</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Status</th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-muted px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm text-muted font-mono">#{p.id}</td>
                    <td className="px-5 py-3.5 text-sm font-bold max-w-[250px] truncate">{p.title}</td>
                    <td className={`px-5 py-3.5 text-sm font-bold ${difficultyColor(p.difficulty)}`}>{p.difficulty}</td>
                    <td className="px-5 py-3.5 text-sm text-muted">{p.topic}</td>
                    <td className="px-5 py-3.5 text-sm text-center text-muted">{p._count?.testCases || 0}</td>
                    <td className="px-5 py-3.5 text-sm text-center text-muted">{p._count?.submissions || 0}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        p.isArchived
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {p.isArchived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openTestCases(p)}
                          className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors text-muted hover:text-purple-400"
                          title="Test Cases"
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted hover:text-white"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setArchiveTarget(p)}
                          className={`p-2 rounded-lg transition-colors ${
                            p.isArchived
                              ? 'hover:bg-green-500/10 text-muted hover:text-green-400'
                              : 'hover:bg-amber-500/10 text-muted hover:text-amber-400'
                          }`}
                          title={p.isArchived ? 'Restore' : 'Archive'}
                        >
                          {p.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
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
          <button
            onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
            disabled={pagination.page <= 1}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-muted">
            Page <span className="text-white font-bold">{pagination.page}</span> of <span className="text-white font-bold">{totalPages}</span>
          </span>
          <button
            onClick={() => setPagination(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
            disabled={pagination.page >= totalPages}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <AdminProblemForm
          onClose={() => setShowForm(false)}
          onSave={handleCreate}
        />
      )}

      {/* Edit Form Modal */}
      {editProblem && (
        <AdminProblemForm
          problem={editProblem}
          onClose={() => setEditProblem(null)}
          onSave={handleEdit}
        />
      )}

      {/* Archive Confirmation Modal */}
      <AnimatePresence>
        {archiveTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center"
            onClick={() => setArchiveTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-white/10 rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${archiveTarget.isArchived ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                  {archiveTarget.isArchived
                    ? <ArchiveRestore className="w-6 h-6 text-green-400" />
                    : <AlertTriangle className="w-6 h-6 text-amber-400" />
                  }
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {archiveTarget.isArchived ? 'Restore Problem?' : 'Archive Problem?'}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted mb-2">
                <span className="text-white font-bold">{archiveTarget.title}</span>
              </p>
              <p className="text-sm text-muted mb-6">
                {archiveTarget.isArchived
                  ? 'This will make the problem visible to all users again.'
                  : 'This will hide the problem from normal users. All submissions and analytics will be preserved.'}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setArchiveTarget(null)}
                  className="px-5 py-2.5 text-sm font-bold text-muted hover:text-white transition-colors rounded-xl hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveToggle}
                  disabled={archiving}
                  className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all disabled:opacity-50 ${
                    archiveTarget.isArchived
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                      : 'bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30'
                  }`}
                >
                  {archiving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : archiveTarget.isArchived ? (
                    <ArchiveRestore className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                  {archiveTarget.isArchived ? 'Restore' : 'Archive'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Case Management Modal */}
      <AnimatePresence>
        {tcProblem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto py-8"
            onClick={() => setTcProblem(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="bg-surface border border-white/10 rounded-2xl w-full max-w-3xl mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold">Test Cases</h2>
                  <p className="text-xs text-muted mt-0.5">Problem #{tcProblem.id}: {tcProblem.title}</p>
                </div>
                <button onClick={() => setTcProblem(null)} className="p-2 hover:bg-white/10 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {tcLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-purple-400/20 border-t-purple-400 rounded-full animate-spin" />
                  </div>
                ) : testCases.length === 0 ? (
                  <p className="text-center text-muted py-8">No test cases yet.</p>
                ) : (
                  testCases.map((tc, i) => (
                    <div
                      key={tc.id}
                      className={`border rounded-xl p-4 space-y-2 ${
                        tc.isArchived
                          ? 'border-red-500/20 bg-red-500/[0.02] opacity-60'
                          : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted">#{tc.id}</span>
                          <span className={`flex items-center gap-1 text-[10px] font-bold ${
                            tc.isHidden ? 'text-amber-400' : 'text-muted'
                          }`}>
                            {tc.isHidden ? <><EyeOff className="w-3 h-3" /> Hidden</> : <><Eye className="w-3 h-3" /> Public</>}
                          </span>
                          {tc.isArchived && (
                            <span className="text-[10px] font-black text-red-400 uppercase">Archived</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleArchiveTestCase(tc.id)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                            tc.isArchived
                              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                          }`}
                        >
                          {tc.isArchived ? 'Restore' : 'Archive'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-muted/60 mb-1 block">Input</label>
                          <pre className="bg-white/5 rounded-lg p-2 text-xs font-mono whitespace-pre-wrap max-h-20 overflow-y-auto">{tc.input}</pre>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-muted/60 mb-1 block">Expected Output</label>
                          <pre className="bg-white/5 rounded-lg p-2 text-xs font-mono whitespace-pre-wrap max-h-20 overflow-y-auto">{tc.expectedOutput}</pre>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Test Case Form */}
              <div className="p-6 border-t border-white/10 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Add New Test Case</p>
                <div className="grid grid-cols-2 gap-3">
                  <textarea
                    value={newTc.input}
                    onChange={(e) => setNewTc(p => ({ ...p, input: e.target.value }))}
                    placeholder="Input..."
                    rows={2}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-primary/50 focus:outline-none resize-none"
                  />
                  <textarea
                    value={newTc.expectedOutput}
                    onChange={(e) => setNewTc(p => ({ ...p, expectedOutput: e.target.value }))}
                    placeholder="Expected output..."
                    rows={2}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-primary/50 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setNewTc(p => ({ ...p, isHidden: !p.isHidden }))}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                      newTc.isHidden ? 'text-amber-400' : 'text-muted hover:text-white'
                    }`}
                  >
                    {newTc.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {newTc.isHidden ? 'Hidden' : 'Public'}
                  </button>
                  <button
                    onClick={handleAddTestCase}
                    disabled={tcAdding || !newTc.input.trim() || !newTc.expectedOutput.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold text-xs rounded-xl hover:bg-purple-500/30 transition-all disabled:opacity-50"
                  >
                    {tcAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add Test Case
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

export default AdminProblems;
