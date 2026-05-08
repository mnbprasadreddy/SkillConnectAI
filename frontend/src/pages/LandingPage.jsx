import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Shield, 
  Cpu, 
  Globe, 
  ArrowRight, 
  Github,
  PlayCircle,
  BrainCircuit,
  Code2,
  Mic2,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const features = [
    { 
      title: 'AI Mock Interviews', 
      desc: 'Real-time biometric analysis and speech evaluation with our advanced neural interviewer.',
      icon: Mic2,
      color: 'cyan'
    },
    { 
      title: 'Neural Workspace', 
      desc: 'High-performance coding environment with instant Judge0 execution and AI feedback.',
      icon: Code2,
      color: 'purple'
    },
    { 
      title: 'Predictive Analytics', 
      desc: 'Detailed skill mapping and progress tracking powered by Gemini 1.5 Flash.',
      icon: BarChart3,
      color: 'blue'
    }
  ];

  const stats = [
    { label: 'Neural Queries', value: '1.2M+' },
    { label: 'Active Engineers', value: '50k+' },
    { label: 'Interviews Conducted', value: '250k+' },
    { label: 'Success Rate', value: '94%' },
  ];

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-quantum-gradient rounded-xl flex items-center justify-center shadow-neon-cyan">
              <Zap className="w-6 h-6 text-background fill-background" />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase">SkillConnect AI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
            <a href="#network" className="hover:text-primary transition-colors">Network</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold hover:text-primary transition-colors">Login</Link>
            <Link to="/register" className="neon-button-cyan py-2 px-6 text-sm">Join Neural Network</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[150px] -z-10 rounded-full" />
        <div className="absolute top-60 right-0 w-[400px] h-[400px] bg-secondary/10 blur-[120px] -z-10 rounded-full" />

        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold tracking-widest text-primary uppercase shadow-neon-cyan/20"
          >
            <BrainCircuit className="w-4 h-4" />
            Next-Gen AI Interview Evolution
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9]"
          >
            Forge Your <span className="bg-quantum-gradient bg-clip-text text-transparent">Digital Destiny</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed"
          >
            SkillConnect AI bridges the gap between human potential and artificial intelligence. 
            The only platform providing real-time biometric feedback for the modern engineer.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 pt-6"
          >
            <Link to="/register" className="neon-button-cyan text-lg px-8 py-4 flex items-center gap-3">
              Initialize Session <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex items-center gap-3 hover:bg-white/10 transition-all">
              <PlayCircle className="w-6 h-6 text-muted" /> Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-surface/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <h3 className="text-4xl font-bold bg-quantum-gradient bg-clip-text text-transparent">{stat.value}</h3>
              <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Neural Capabilities</h2>
            <p className="text-muted max-w-xl mx-auto">Engineered for performance. Powered by state-of-the-art AI models.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => {
                const colorMap = {
                  cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:shadow-neon-cyan',
                  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:shadow-neon-purple',
                  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:shadow-neon-cyan',
                };
                return (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -10 }}
                    className="glass-card p-10 space-y-6 group"
                  >
                    <div className={`w-14 h-14 border rounded-2xl flex items-center justify-center transition-all ${colorMap[f.color] || colorMap.cyan}`}>
                      <f.icon className="w-8 h-8" />
                    </div>
                    <h4 className="text-2xl font-bold">{f.title}</h4>
                    <p className="text-muted leading-relaxed">{f.desc}</p>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section id="solutions" className="py-32 px-6 relative">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent -z-10" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-lg text-[10px] font-bold text-secondary uppercase tracking-widest">
              Live Biometrics
            </div>
            <h2 className="text-5xl font-bold leading-tight">Master your presence in <span className="text-secondary">Real-Time</span>.</h2>
            <p className="text-muted text-lg leading-relaxed">
              Our AI analysis engine monitors gaze stability, speech clarity, and emotional equilibrium during your practice sessions. Never walk into an interview unprepared again.
            </p>
            <div className="space-y-4">
              {[
                'Face Mesh Posture Tracking',
                'Whisper AI Speech-to-Text',
                'Filler Word Detection Algorithm',
                'Composite Confidence Scoring'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-neon-purple" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-video glass-card border-secondary/20 p-4 shadow-2xl relative z-10">
              <div className="w-full h-full bg-black/50 rounded-xl overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent flex items-center justify-center">
                    <BrainCircuit className="w-20 h-20 text-secondary/50 animate-pulse" />
                 </div>
                 {/* HUD Elements Overlay */}
                 <div className="absolute top-4 left-4 space-y-2">
                    <div className="h-1 w-24 bg-secondary/40 rounded-full overflow-hidden">
                       <motion.div animate={{ width: ['20%', '80%', '20%'] }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-secondary" />
                    </div>
                    <div className="text-[10px] font-mono text-secondary">Neural_Stability: 94.2%</div>
                 </div>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/20 blur-[60px] rounded-full" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto glass-card p-20 text-center space-y-10 relative overflow-hidden border-primary/30">
          <div className="absolute top-0 left-0 w-full h-full bg-quantum-gradient opacity-[0.03] -z-10" />
          <h2 className="text-5xl font-bold">Ready to synchronize?</h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Join the elite network of engineers using SkillConnect AI to conquer the world's most competitive roles.
          </p>
          <div className="flex justify-center gap-6">
            <Link to="/register" className="neon-button-cyan px-10 py-4 text-lg">Initialize Account</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-surface/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3 opacity-50">
            <Zap className="w-6 h-6 text-primary" />
            <span className="font-bold tracking-widest uppercase text-sm">SkillConnect AI</span>
          </div>
          <p className="text-muted text-xs">© 2026 Neural Bridge Technologies. All rights reserved.</p>
          <div className="flex gap-6">
            <Github className="w-5 h-5 text-muted hover:text-white transition-colors cursor-pointer" />
            <Globe className="w-5 h-5 text-muted hover:text-white transition-colors cursor-pointer" />
            <Shield className="w-5 h-5 text-muted hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
