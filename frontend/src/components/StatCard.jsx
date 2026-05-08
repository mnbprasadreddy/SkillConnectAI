import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, trend, trendType = 'up', color = 'cyan' }) => {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
    green: 'from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-400',
    orange: 'from-orange-500/20 to-yellow-500/10 border-orange-500/30 text-orange-400',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`glass-card bg-gradient-to-br ${colorMap[color]} p-6 space-y-4`}
    >
      <div className="flex items-center justify-between">
        <div className="p-3 bg-white/5 rounded-xl">
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendType === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <h3 className="text-3xl font-bold tracking-tight mt-1">{value}</h3>
      </div>
    </motion.div>
  );
};

export default StatCard;
