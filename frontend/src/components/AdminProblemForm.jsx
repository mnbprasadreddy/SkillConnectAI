import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Eye, EyeOff, Save, Loader2 } from 'lucide-react';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const TOPICS = ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'DP', 'Sorting', 'Hash Tables', 'Binary Search', 'Stacks', 'Queues', 'Recursion', 'Math', 'Greedy', 'Backtracking'];

const emptyTestCase = { input: '', expectedOutput: '', isHidden: false };

const AdminProblemForm = ({ problem, onClose, onSave }) => {
  const isEdit = !!problem;
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    topic: 'Arrays',
    constraints: '',
    examples: '',
    starterCode: '',
    testCases: [{ ...emptyTestCase }, { ...emptyTestCase }],
  });

  useEffect(() => {
    if (problem) {
      setForm({
        title: problem.title || '',
        description: problem.description || '',
        difficulty: problem.difficulty || 'Easy',
        topic: problem.topic || 'Arrays',
        constraints: problem.constraints || '',
        examples: problem.examples || '',
        starterCode: problem.starterCode || '',
        testCases: problem.testCases?.length > 0
          ? problem.testCases.map(tc => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden,
            }))
          : [{ ...emptyTestCase }, { ...emptyTestCase }],
      });
    }
  }, [problem]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const updateTestCase = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.testCases];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, testCases: updated };
    });
  };

  const addTestCase = () => {
    setForm(prev => ({ ...prev, testCases: [...prev.testCases, { ...emptyTestCase }] }));
  };

  const removeTestCase = (index) => {
    if (form.testCases.length <= 1) return;
    setForm(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Title is required');
    if (!form.description.trim()) return setError('Description is required');
    if (!form.topic.trim()) return setError('Topic is required');

    // Validate test cases have at least input and output
    const validTestCases = form.testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim());
    if (validTestCases.length === 0) return setError('At least one test case with input and expected output is required');

    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, testCases: validTestCases });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to save problem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto py-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-surface border border-white/10 rounded-2xl w-full max-w-4xl mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold">{isEdit ? 'Edit Problem' : 'Create New Problem'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Two Sum"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Difficulty + Topic row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Difficulty *</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => updateField('difficulty', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors"
                >
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Topic *</label>
                <select
                  value={form.topic}
                  onChange={(e) => updateField('topic', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors"
                >
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Full problem description..."
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors resize-none font-mono"
              />
            </div>

            {/* Constraints */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Constraints</label>
              <textarea
                value={form.constraints}
                onChange={(e) => updateField('constraints', e.target.value)}
                placeholder="e.g. 1 <= nums.length <= 10^4"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors resize-none font-mono"
              />
            </div>

            {/* Examples */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Examples</label>
              <textarea
                value={form.examples}
                onChange={(e) => updateField('examples', e.target.value)}
                placeholder="Input: nums = [2,7,11,15], target = 9&#10;Output: [0,1]"
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors resize-none font-mono"
              />
            </div>

            {/* Starter Code */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Starter Code</label>
              <textarea
                value={form.starterCode}
                onChange={(e) => updateField('starterCode', e.target.value)}
                placeholder="def solution(nums, target):&#10;    pass"
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:outline-none transition-colors resize-none font-mono"
              />
            </div>

            {/* Test Cases */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Test Cases *</label>
                <button
                  onClick={addTestCase}
                  className="flex items-center gap-1.5 text-primary text-xs font-bold hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Test Case
                </button>
              </div>

              <div className="space-y-3">
                {form.testCases.map((tc, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                        Test Case #{i + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateTestCase(i, 'isHidden', !tc.isHidden)}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${tc.isHidden ? 'text-amber-400' : 'text-muted hover:text-white'}`}
                          title={tc.isHidden ? 'Hidden from users' : 'Visible to users'}
                        >
                          {tc.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {tc.isHidden ? 'Hidden' : 'Public'}
                        </button>
                        {form.testCases.length > 1 && (
                          <button
                            onClick={() => removeTestCase(i)}
                            className="p-1 text-red-400/50 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-muted/60 mb-1 block">Input</label>
                        <textarea
                          value={tc.input}
                          onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                          placeholder="[2,7,11,15]\n9"
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-primary/50 focus:outline-none transition-colors resize-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-muted/60 mb-1 block">Expected Output</label>
                        <textarea
                          value={tc.expectedOutput}
                          onChange={(e) => updateTestCase(i, 'expectedOutput', e.target.value)}
                          placeholder="[0,1]"
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-primary/50 focus:outline-none transition-colors resize-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-muted hover:text-white transition-colors rounded-xl hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary/20 border border-primary/30 text-primary font-bold text-sm rounded-xl hover:bg-primary/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {isEdit ? 'Update Problem' : 'Create Problem'}</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminProblemForm;
