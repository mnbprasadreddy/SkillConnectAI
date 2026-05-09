import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, SlidersHorizontal, ChevronLeft, ChevronRight, BrainCircuit } from 'lucide-react';
import ProblemCard from '../components/ProblemCard';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    topic: '',
    difficulty: '',
  });
  const [topics, setTopics] = useState(['Arrays', 'Strings', 'Linked Lists', 'Trees', 'DP', 'Graphs', 'Sorting']);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalCount: 0,
  });

  const difficulties = ['Easy', 'Medium', 'Hard'];

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        topic: filters.topic,
        difficulty: filters.difficulty,
      };
      const response = await api.get('/problems', { params });
      
      console.log("[Problems] Raw API Response:", response);

      // api.js interceptor unwraps the response — root level has: data, pagination, topics
      const problemsToSet = Array.isArray(response?.data) ? response.data : [];
      console.log("[Problems] Problems loaded:", problemsToSet.length);
      setProblems(problemsToSet);

      // Pagination lives at root level of the unwrapped response
      const paginationData = response?.pagination || {};
      setPagination(prev => ({
        ...prev,
        totalCount: paginationData.totalCount ?? paginationData.total ?? 0
      }));

      // Topics live at root level too (spread via ...extras in apiResponse.paginated)
      const topicsData = response?.topics;
      if (Array.isArray(topicsData) && topicsData.length > 0) {
        setTopics(topicsData);
      }
    } catch (err) {
      console.error('Failed to fetch problems:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, filters.topic, filters.difficulty]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProblems();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchProblems]);

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: prev[type] === value ? '' : value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Neural Library</h1>
          <p className="text-muted text-lg">Curated algorithmic challenges for the modern engineer.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search challenges..." 
              className="bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-6 outline-none focus:border-primary/50 transition-all w-full md:w-64"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
            <SlidersHorizontal className="w-5 h-5 text-muted" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <button 
          onClick={() => {
            setFilters({ topic: '', difficulty: '' });
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${!filters.topic && !filters.difficulty ? 'bg-primary border-primary text-background shadow-neon-cyan' : 'bg-white/5 border-white/5 text-muted hover:bg-white/10'}`}
        >
          All Challenges
        </button>
        
        <div className="h-6 w-px bg-white/10 mx-2" />

        {difficulties.map(d => (
          <button 
            key={d}
            onClick={() => handleFilterChange('difficulty', d)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filters.difficulty === d ? 'border-primary text-primary bg-primary/10 shadow-neon-cyan' : 'border-white/5 text-muted hover:border-white/10 bg-white/5'}`}
          >
            {d}
          </button>
        ))}

        <div className="h-6 w-px bg-white/10 mx-2" />

        <div className="flex flex-wrap gap-2">
          {topics.map(t => (
            <button 
              key={t}
              onClick={() => handleFilterChange('topic', t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filters.topic === t ? 'bg-secondary border-secondary text-white shadow-neon-purple' : 'bg-white/5 border-white/5 text-muted hover:bg-white/10'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="glass-card h-[280px] animate-pulse bg-white/5" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {problems.map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </AnimatePresence>
          </div>

          {problems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 glass-card border-dashed">
              <div className="p-6 bg-primary/10 rounded-full animate-float">
                <BrainCircuit className="w-12 h-12 text-primary shadow-neon-cyan" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">No Neural Matches Found</h3>
                <p className="text-muted max-w-xs mx-auto text-sm">Try adjusting your filters or search coordinates to find new challenges.</p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalCount > pagination.limit && (
            <div className="flex items-center justify-center gap-6 mt-12">
              <button 
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="p-3 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 hover:bg-white/10 transition-all group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest">
                Sector <span className="text-primary font-mono text-sm mx-1">{pagination.page}</span> of {Math.ceil(pagination.totalCount / pagination.limit)}
              </div>
              <button 
                disabled={pagination.page >= Math.ceil(pagination.totalCount / pagination.limit)}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="p-3 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 hover:bg-white/10 transition-all group"
              >
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Problems;
