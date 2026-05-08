import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mapAuthError } from '../utils/authErrors';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  
  const [verificationSent, setVerificationSent] = useState(false);
  
  const { register, login, user, isRecovering } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && user.dbUser && user.emailVerified) navigate('/app/dashboard');
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRecover = async () => {
    try {
      setError('');
      setLoading(true);
      console.log('[AuthRecovery] Initializing recovery login...');
      await login(formData.email, formData.password);
      // AuthContext will handle the sync
      navigate('/app/dashboard');
    } catch (err) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsDuplicate(false);
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await register(formData.email, formData.password, formData.name);
      setVerificationSent(true);
      // We don't navigate immediately, allow user to see verification notice
      setTimeout(() => navigate('/app/dashboard'), 3000);
    } catch (err) {
      console.error('[Auth] Registration Error:', err.code, err.message);
      const friendlyMessage = mapAuthError(err.code);
      setError(friendlyMessage);
      
      if (err.code === 'auth/email-already-in-use') {
        setIsDuplicate(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-10 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-quantum-gradient bg-clip-text text-transparent">
              {verificationSent ? 'Link Dispatched' : (isRecovering ? 'Healing Identity' : 'Initialize Account')}
            </h1>
            <p className="text-muted">
              {verificationSent 
                ? 'Check your inbox to verify your neural identity.' 
                : (isRecovering ? 'Restoring your neural profile across the ecosystem...' : 'Begin your journey into AI-powered development')}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {verificationSent && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/10 border border-primary/20 p-6 rounded-2xl text-center space-y-4"
              >
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Verification Sent</h3>
                  <p className="text-xs text-muted">We've sent a neural verification link to {formData.email}. Please verify to continue.</p>
                </div>
              </motion.div>
            )}

            {error && !verificationSent && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-3"
              >
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
                
                {isDuplicate && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pt-2 border-t border-red-500/10 space-y-2"
                  >
                    <button 
                      onClick={handleRecover}
                      className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      Recover & Sync Account
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <Link 
                      to="/login" 
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-muted rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      Sign In Instead
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!verificationSent && (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      name="name"
                      type="text"
                      required
                      className="input-field pl-12"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      name="email"
                      type="email"
                      required
                      className="input-field pl-12"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <input
                        name="password"
                        type="password"
                        required
                        className="input-field pl-12 py-2.5 text-sm"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted ml-1">Confirm</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        className="input-field pl-12 py-2.5 text-sm"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full neon-button-purple flex items-center justify-center gap-2 group mt-4 relative overflow-hidden"
                >
                  <span className={loading ? 'opacity-0' : 'opacity-100 flex items-center gap-2'}>
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-muted">
                Already registered?{' '}
                <Link to="/login" title="Login" className="text-secondary hover:underline font-semibold">Sign in here</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
