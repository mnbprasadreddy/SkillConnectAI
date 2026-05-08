import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Zap, 
  ChevronRight, 
  Cpu, 
  Globe, 
  Eye,
  EyeOff,
  Save,
  Trash2,
  Lock,
  Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const sections = [
    { id: 'profile', label: 'Neural Profile', icon: User },
    { id: 'security', label: 'Security Protocols', icon: Shield },
    { id: 'notifications', label: 'Sync Alerts', icon: Bell },
    { id: 'api', label: 'Core Integration', icon: Cpu }
  ];

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call for demo
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div>
        <h1 className="text-4xl font-black tracking-tight uppercase italic italic">Neural Settings</h1>
        <p className="text-muted mt-1 font-bold uppercase tracking-widest text-[10px]">Configure your SkillConnect AI interface and core protocols</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all border ${
                activeSection === section.id 
                  ? 'bg-primary/10 border-primary/30 text-primary shadow-neon-cyan/10' 
                  : 'bg-white/5 border-transparent text-muted hover:bg-white/10'
              }`}
            >
              <section.icon className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">{section.label}</span>
              {activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
          
          <div className="pt-8">
            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all group">
              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Terminate Account</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="glass-card p-10 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Zap className="w-32 h-32 text-primary" />
            </div>

            {activeSection === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl bg-white/5 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-muted" />
                      )}
                    </div>
                    <button className="absolute bottom-2 right-2 p-2 bg-primary text-background rounded-lg shadow-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">{user?.displayName || 'Quantum Explorer'}</h3>
                    <p className="text-xs text-muted font-bold uppercase tracking-widest">{user?.email}</p>
                    <div className="flex gap-2 pt-2">
                       <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase rounded-lg">Verified Node</span>
                       <span className="px-3 py-1 bg-white/5 border border-white/10 text-muted text-[8px] font-black uppercase rounded-lg">Sector 7</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Full Neural Name</label>
                    <input type="text" defaultValue={user?.displayName} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Communication Channel</label>
                    <input type="email" defaultValue={user?.email} disabled className="w-full bg-white/2 border border-white/5 text-muted/50 rounded-2xl p-4 text-sm font-bold outline-none cursor-not-allowed" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Bio Signature</label>
                    <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary/50 transition-all resize-none" placeholder="Enter your mission objective..." />
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'api' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-5">
                   <div className="p-3 bg-primary/20 rounded-xl">
                      <Lock className="w-6 h-6 text-primary" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-widest text-primary">Neural Integration Key</h4>
                      <p className="text-xs text-muted leading-relaxed">Use this key to integrate your SkillConnect AI profile with external IDEs and recruitment terminals.</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type={showToken ? 'text' : 'password'} 
                      value="sk_neural_live_8v923kjnf823m4lkj23n" 
                      readOnly 
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pr-16 text-xs font-mono tracking-widest"
                    />
                    <button 
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {showToken ? <EyeOff className="w-4 h-4 text-muted" /> : <Eye className="w-4 h-4 text-muted" />}
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button className="neon-button-cyan py-3 px-8 text-[10px] font-black uppercase tracking-widest">Regenerate Key</button>
                    <button className="bg-white/5 border border-white/10 py-3 px-8 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/10">Copy to Clipboard</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                   <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-widest">Two-Factor Authentication</h4>
                      <p className="text-[10px] text-muted">Add an extra layer of biometric security to your node.</p>
                   </div>
                   <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer group">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-muted rounded-full group-hover:bg-white transition-all" />
                   </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                   <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-widest">Login Shield</h4>
                      <p className="text-[10px] text-muted">Receive alerts for synchronization attempts from unknown coordinates.</p>
                   </div>
                   <div className="w-12 h-6 bg-primary/20 rounded-full relative cursor-pointer shadow-neon-cyan">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full" />
                   </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                   <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">Authorized Terminals</h4>
                   <div className="space-y-3">
                      {[
                        { device: 'Neural_WS_01 (MacBook Pro)', loc: 'Mumbai, IN', time: 'Active Now', current: true },
                        { device: 'Mobile_Link_V2 (iPhone 15)', loc: 'Mumbai, IN', time: '2 hours ago', current: false }
                      ].map((term, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
                           <div className="flex items-center gap-4">
                              <div className="p-2 bg-white/5 rounded-lg"><Globe className="w-4 h-4 text-muted" /></div>
                              <div>
                                 <p className="text-xs font-bold">{term.device}</p>
                                 <p className="text-[9px] text-muted uppercase font-bold tracking-tighter">{term.loc} • {term.time}</p>
                              </div>
                           </div>
                           {!term.current && <button className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:underline">Revoke</button>}
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}

            <div className="pt-10 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="neon-button-cyan px-10 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Commit Protocols
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
