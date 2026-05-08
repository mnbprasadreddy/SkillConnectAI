import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Video, 
  FileText, 
  ChevronRight, 
  Search, 
  Filter,
  Brain,
  Zap,
  Star,
  Download,
  ExternalLink
} from 'lucide-react';

const LearningMaterials = () => {
  const [activeTab, setActiveTab] = useState('all');

  const categories = [
    { id: 'all', label: 'All Modules' },
    { id: 'algorithms', label: 'Algorithms' },
    { id: 'system_design', label: 'System Design' },
    { id: 'behavioral', label: 'Behavioral' },
    { id: 'frontend', label: 'Frontend' }
  ];

  const materials = [
    {
      id: 1,
      title: 'Mastering Dynamic Programming',
      type: 'video',
      category: 'algorithms',
      duration: '45m',
      difficulty: 'Hard',
      rating: 4.9,
      desc: 'Deep dive into optimization patterns and state transition mapping.'
    },
    {
      id: 2,
      title: 'Scalability Fundamentals',
      type: 'document',
      category: 'system_design',
      duration: '12 pages',
      difficulty: 'Medium',
      rating: 4.8,
      desc: 'Core concepts of load balancing, sharding, and consistency models.'
    },
    {
      id: 3,
      title: 'The STAR Method Guide',
      type: 'document',
      category: 'behavioral',
      duration: '5 pages',
      difficulty: 'Easy',
      rating: 5.0,
      desc: 'How to structure your behavioral answers for maximum neural impact.'
    },
    {
      id: 4,
      title: 'Graph Theory Synthesis',
      type: 'video',
      category: 'algorithms',
      duration: '32m',
      difficulty: 'Hard',
      rating: 4.7,
      desc: 'Visualizing DFS, BFS, and Dijkstra in high-dimensional space.'
    }
  ];

  const filteredMaterials = activeTab === 'all' 
    ? materials 
    : materials.filter(m => m.category === activeTab);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic italic">Neural Archives</h1>
          <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">Curated high-frequency learning modules</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search Archives..." 
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold outline-none focus:border-primary/50 transition-all w-64"
            />
          </div>
          <button className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
            <Filter className="w-5 h-5 text-muted" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              activeTab === cat.id ? 'bg-primary border-primary text-background shadow-neon-cyan' : 'bg-white/5 border-white/10 text-muted hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 group hover:border-primary/30 transition-all relative overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${item.type === 'video' ? 'text-primary' : 'text-secondary'}`}>
                {item.type === 'video' ? <Video className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span className="text-[10px] font-black">{item.rating}</span>
                </div>
                <span className={`text-[9px] font-black uppercase mt-1 ${
                  item.difficulty === 'Hard' ? 'text-red-400' :
                  item.difficulty === 'Medium' ? 'text-amber-400' : 'text-green-400'
                }`}>
                  {item.difficulty}
                </span>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-muted text-xs leading-relaxed">{item.desc}</p>
              
              <div className="flex items-center gap-4 text-[10px] font-black text-muted uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{item.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Interactive</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                {item.type === 'video' ? 'Play Module' : 'Open Doc'}
                <ExternalLink className="w-3 h-3" />
              </button>
              <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-primary transition-all">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Request Module Card */}
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
      </div>
    </motion.div>
  );
};

export default LearningMaterials;
