import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Code2, 
  CheckCircle2, 
  ArrowUpRight,
  Clock,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProblemCard = ({ problem }) => {
  const difficultyColors = {
    Easy: 'text-green-400 bg-green-400/10 border-green-400/20',
    Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-card p-6 flex flex-col h-full group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${difficultyColors[problem.difficulty]}`}>
          {problem.difficulty}
        </div>
        {problem.isSolved && (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        )}
      </div>

      <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1 mb-2">
        {problem.title}
      </h3>
      
      <p className="text-sm text-muted line-clamp-2 mb-6 flex-1">
        {problem.description || 'Challenge your algorithmic skills with this problem.'}
      </p>

      <div className="flex items-center justify-between text-xs text-muted mb-6">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>{problem.topic}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{problem.estimatedTime || '30m'}</span>
        </div>
      </div>

      <Link 
        to={`/problems/${problem.id}`}
        className={`w-full flex items-center justify-center gap-2 py-3 border rounded-xl font-semibold transition-all ${
          problem.isSolved 
            ? 'bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20' 
            : 'bg-white/5 border-white/10 group-hover:bg-primary/10 group-hover:border-primary/50 group-hover:text-primary'
        }`}
      >
        {problem.isSolved ? 'Solved' : 'Solve Challenge'}
        {!problem.isSolved && <ArrowUpRight className="w-4 h-4" />}
      </Link>
    </motion.div>
  );
};

export default ProblemCard;
