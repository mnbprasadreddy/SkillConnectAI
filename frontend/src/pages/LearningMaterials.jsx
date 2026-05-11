import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Video, FileText, ChevronRight, Search, Filter,
  Brain, Zap, Star, ExternalLink, Link2, Youtube, Loader2,
  AlertCircle, Sparkles, GraduationCap
} from 'lucide-react';
import api from '../services/api';

const difficultyColors = {
  Beginner: 'text-green-400',
  Intermediate: 'text-amber-400',
  Advanced: 'text-red-400',
};

const LearningMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState('all');
  const [search, setSearch] = useState('');

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTopic !== 'all') params.topic = activeTopic;
      if (search.trim()) params.search = search.trim();

      const [matRes, topicRes] = await Promise.all([
        api.get('/materials', { params }),
        api.get('/materials/topics').catch(() => ({ data: [] })),
      ]);

      const mats = Array.isArray(matRes?.data) ? matRes.data : Array.isArray(matRes) ? matRes : [];
      setMaterials(mats);

      const tops = Array.isArray(topicRes?.data) ? topicRes.data : Array.isArray(topicRes) ? topicRes : [];
      if (tops.length > 0) setTopics(tops);
    } catch (err) {
      console.error('Failed to fetch materials', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, [activeTopic]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  // Determine link count for each material
  const getLinkCount = (m) => [m.articleUrl, m.youtubeUrl, m.pdfUrl].filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic">Neural Archives</h1>
          <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">Curated learning modules assigned by platform admins</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search Archives..."
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold outline-none focus:border-primary/50 transition-all w-64"
            />
          </div>
          <button type="submit" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
            <Filter className="w-5 h-5 text-muted" />
          </button>
        </form>
      </div>

      {/* Topic Tabs */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTopic('all')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
            activeTopic === 'all' ? 'bg-primary border-primary text-background shadow-neon-cyan' : 'bg-white/5 border-white/10 text-muted hover:text-white'
          }`}
        >
          All Modules
        </button>
        {topics.map(topic => (
          <button key={topic} onClick={() => setActiveTopic(topic)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeTopic === topic ? 'bg-primary border-primary text-background shadow-neon-cyan' : 'bg-white/5 border-white/10 text-muted hover:text-white'
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-xs font-black uppercase tracking-widest text-muted">Loading Archives...</span>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {materials.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.06 }}
                className="glass-card p-8 group hover:border-primary/30 transition-all relative overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                    {item.youtubeUrl ? <Video className="w-5 h-5" /> : item.pdfUrl ? <FileText className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${difficultyColors[item.difficulty] || 'text-cyan-400'}`}>
                      {item.difficulty}
                    </span>
                    <span className="text-[9px] font-bold text-muted">{getLinkCount(item)} resource{getLinkCount(item) !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3 flex-1">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors leading-snug">{item.title}</h3>
                  {item.description && (
                    <p className="text-muted text-xs leading-relaxed line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-[10px] font-black text-muted uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{item.topic}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {item.tags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.split(',').slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-lg text-[9px] text-muted">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resource Links */}
                <div className="mt-6 flex gap-2">
                  {item.articleUrl && (
                    <a href={item.articleUrl} target="_blank" rel="noreferrer"
                      className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-cyan-400" /> Article
                    </a>
                  )}
                  {item.youtubeUrl && (
                    <a href={item.youtubeUrl} target="_blank" rel="noreferrer"
                      className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                      <Youtube className="w-3.5 h-3.5 text-red-400" /> Video
                    </a>
                  )}
                  {item.pdfUrl && (
                    <a href={item.pdfUrl} target="_blank" rel="noreferrer"
                      className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-400" /> PDF
                    </a>
                  )}
                  {!item.articleUrl && !item.youtubeUrl && !item.pdfUrl && (
                    <div className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted text-center">
                      No Links Available
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {materials.length === 0 && !loading && (
            <div className="col-span-full glass-card p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-5 bg-white/5 rounded-full border-2 border-dashed border-white/10">
                <Brain className="w-10 h-10 text-muted" />
              </div>
              <h3 className="text-xl font-bold">No Learning Materials Yet</h3>
              <p className="text-sm text-muted max-w-sm">Learning materials will appear here once platform admins curate resources for your growth journey.</p>
            </div>
          )}

          {/* Request Card */}
          {materials.length > 0 && (
            <div className="glass-card p-8 border-dashed flex flex-col items-center justify-center text-center space-y-4 min-h-[300px] opacity-60 hover:opacity-100 transition-all cursor-pointer">
              <div className="p-5 bg-white/5 rounded-full border-2 border-dashed border-white/10">
                <Brain className="w-10 h-10 text-muted" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Neural Gap Detected?</h4>
                <p className="text-[10px] text-muted uppercase font-black tracking-widest mt-1">Request custom learning module</p>
              </div>
              <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-4">
                Initialize Request <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default LearningMaterials;
