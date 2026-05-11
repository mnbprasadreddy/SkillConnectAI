import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Mail, ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AICoachButton from '../components/ai-coach/AICoachButton';

const VerificationBanner = () => {
  const { user, resendVerification, checkEmailVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResend = async () => {
    try {
      setLoading(true);
      await resendVerification();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to resend verification', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const verified = await checkEmailVerification();
      if (verified) {
        window.location.reload(); // Hard refresh to clear banner
      }
    } catch (err) {
      console.error('Failed to check verification', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.emailVerified) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-20 z-40">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <ShieldAlert className="w-4 h-4 text-primary" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-white uppercase tracking-wider">Verification Required</p>
          <p className="text-[10px] text-muted font-medium">Your neural identity is not yet verified. Some features may be restricted.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={handleResend}
          disabled={loading || success}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
        >
          {success ? (
            <><CheckCircle2 className="w-3 h-3" /> Dispatched</>
          ) : (
            <><Mail className="w-3 h-3" /> Resend Link</>
          )}
        </button>
        <div className="w-[1px] h-4 bg-white/10" />
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-3 h-3" /> I've Verified
        </button>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background text-white">
      <Sidebar />
      <div className="pl-64">
        <Navbar />
        <div className="pt-20">
          <VerificationBanner />
          <main className="p-8 min-h-screen">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Background Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] -z-10 rounded-full" />
      <div className="fixed bottom-0 left-64 w-[500px] h-[500px] bg-secondary/5 blur-[150px] -z-10 rounded-full" />

      {/* Global AI Coach Button */}
      <AICoachButton />
    </div>
  );
};

export default DashboardLayout;
