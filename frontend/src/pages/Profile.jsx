import React from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  Link as LinkIcon, 
  Github, 
  Twitter, 
  Linkedin,
  Edit3,
  Award,
  Calendar,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user } = useAuth();

  const achievements = [
    { title: 'Neural Pioneer', desc: 'Completed first AI interview.', icon: Award, color: 'cyan' },
    { title: 'Code Surgeon', desc: 'Solved 50+ Hard problems.', icon: Award, color: 'purple' },
    { title: 'Speed Demon', desc: 'Avg response time < 5ms.', icon: Award, color: 'green' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Profile Header Card */}
      <div className="glass-card p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
          <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
            <Settings className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10">
          <div className="relative group">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="profile" className="w-40 h-40 rounded-3xl object-cover border-4 border-surface shadow-2xl" />
            ) : (
              <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-surface shadow-2xl">
                <User className="w-16 h-16 text-primary" />
              </div>
            )}
            <button className="absolute bottom-3 right-3 p-2 bg-primary text-background rounded-lg shadow-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">{user?.displayName || 'Quantum Explorer'}</h1>
              <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase rounded-full tracking-widest self-center">
                {user?.dbUser?.skillLevel || 'Beginner'}
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-muted text-sm font-medium">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user?.email}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Neural Network</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined Sector 7</span>
            </div>

            <div className="flex justify-center md:justify-start gap-3 pt-2">
              <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:text-white transition-all"><Github className="w-4 h-4" /></button>
              <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:text-[#1DA1F2] transition-all"><Twitter className="w-4 h-4" /></button>
              <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:text-[#0A66C2] transition-all"><Linkedin className="w-4 h-4" /></button>
              <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:text-primary transition-all"><LinkIcon className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold">14.2k</p>
              <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Points</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold">#1.2k</p>
              <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Rank</p>
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/10 blur-[100px] rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Achievements & Bio */}
        <div className="lg:col-span-1 space-y-8">
          <section className="glass-card p-8">
            <h3 className="text-xl font-bold mb-6">Neural Bio</h3>
            <p className="text-muted text-sm leading-relaxed">
              "Full-stack engineer passionate about AI architecture and low-latency systems. Currently mastering the quantum realm of React and Node.js."
            </p>
          </section>

          <section className="glass-card p-8">
            <h3 className="text-xl font-bold mb-6">Achievements</h3>
            <div className="space-y-4">
              {achievements.map((ach, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className={`p-3 rounded-xl bg-${ach.color}-500/10 border border-${ach.color}-500/20 text-${ach.color}-400 group-hover:shadow-neon-${ach.color} transition-all`}>
                    <ach.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{ach.title}</h4>
                    <p className="text-xs text-muted">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Detailed Progress */}
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-card p-8">
            <h3 className="text-xl font-bold mb-6">Skill Progression</h3>
            <div className="space-y-6">
              {[
                { label: 'Problem Solving', value: 85, color: 'primary' },
                { label: 'System Architecture', value: 64, color: 'secondary' },
                { label: 'Communication', value: 78, color: 'primary' },
                { label: 'Code Quality', value: 92, color: 'secondary' },
              ].map((skill, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-muted">{skill.label}</span>
                    <span>{skill.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.value}%` }}
                      className={`h-full bg-${skill.color === 'primary' ? 'primary shadow-neon-cyan' : 'secondary shadow-neon-purple'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card p-8">
            <h3 className="text-xl font-bold mb-6">Recent Activity Stream</h3>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 border-l-2 border-white/5 pl-6 relative">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary shadow-neon-cyan" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Completed Behavioral Mock Interview</p>
                    <p className="text-xs text-muted mt-1">2 days ago • Score: 84/100</p>
                  </div>
                  <button className="text-xs text-primary font-bold hover:underline">VIEW</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
