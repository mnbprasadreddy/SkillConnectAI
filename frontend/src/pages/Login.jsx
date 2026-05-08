import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Github, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mapAuthError } from '../utils/authErrors';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, user, isRecovering } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && user.dbUser) navigate('/app/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/app/dashboard');
    } catch (err) {
      console.error('[Auth] Login Error:', err.code, err.message);
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-10 space-y-8 relative">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-quantum-gradient bg-clip-text text-transparent">
              {isRecovering ? 'Restoring Neural Link' : 'Welcome Back'}
            </h1>
            <p className="text-muted">
              {isRecovering ? 'Self-healing identity synchronization in progress...' : 'Enter your coordinates to access the platform'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="email"
                  required
                  className="input-field pl-12"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-muted ml-1">Password</label>
                <Link to="/forgot-password" title="Forgot Password" className="text-xs text-primary hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="password"
                  required
                  className="input-field pl-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full neon-button-cyan flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <span className={loading ? 'opacity-0' : 'opacity-100 flex items-center gap-2'}>
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0D1117] px-4 text-muted">Or continue with</span>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-all text-sm font-medium">
            <Github className="w-5 h-5" />
            GitHub
          </button>

          <p className="text-center text-sm text-muted">
            New explorer?{' '}
            <Link to="/register" title="Create Account" className="text-primary hover:underline font-semibold">Create an account</Link>
          </p>
        </div>
        
        <p className="mt-8 text-center text-xs text-muted/50">
          Powered by SkillConnect AI Advanced Neural Network
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
