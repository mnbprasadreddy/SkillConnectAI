import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Settings,
  MessageSquare,
  ShieldCheck,
  Zap,
  Clock,
  BrainCircuit,
  ChevronRight,
  Eye,
  Activity,
  Smile
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

const LiveInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const type = new URLSearchParams(search).get('type') || 'behavioral';
  
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [stream, setStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [analytics, setAnalytics] = useState({
    confidence: 85,
    eyeContact: 'Analyzing...',
    emotion: 'Analyzing...',
    clarity: 'High',
    posture: 'Stable'
  });
  const [timeLeft, setTimeLeft] = useState(1800); // 30 min
  const [isEnding, setIsEnding] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize Session and Stream
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // 1. Create session in backend
        const sessionResponse = await api.post('/interviews', {
          interviewType: type,
          difficulty: 'Medium'
        });
        
        // sessionResponse is the body { success, message, data }
        const sessionData = sessionResponse.data;
        if (!sessionData || !sessionData.id) {
          throw new Error('Failed to create interview session on server');
        }
        setSession(sessionData);

        // 2. Fetch questions
        try {
          const questionsResponse = await api.post('/interviews/questions', {
            interviewType: type,
            difficulty: 'Medium',
            count: 5
          });
          setQuestions(questionsResponse.data?.questions || []);
        } catch (qErr) {
          console.warn('Questions fetch failed, using fallback bank');
          setQuestions(['Tell me about yourself.', 'What are your strengths?', 'Describe a conflict you resolved.']);
        }

        // 3. Get Media Stream with robust error handling
        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720 }, 
            audio: true 
          });
          setStream(mediaStream);
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (mediaErr) {
          console.error('Media access denied or unavailable:', mediaErr);
          let errorMsg = 'Could not access camera or microphone.';
          if (mediaErr.name === 'NotAllowedError') errorMsg = 'Camera/Mic permission denied. Please allow access in browser settings.';
          else if (mediaErr.name === 'NotFoundError') errorMsg = 'No camera or microphone found on this device.';
          
          alert(errorMsg);
          navigate('/app/interviews');
          return;
        }

        // 4. Connect Socket using central service (namespace: /interview)
        const socket = socketService.getSocket('/interview', { 
          userId: user?.uid || user?.id 
        });
        socketRef.current = socket;
        
        socket.emit('interview:start', { 
          interviewId: sessionData.id, 
          userId: user?.uid || user?.id 
        });

        socket.on('interview:live-analytics', (data) => {
          setAnalytics(prev => ({
            ...prev,
            confidence: data.analytics?.nervousnessScore ? 100 - data.analytics.nervousnessScore : prev.confidence,
            eyeContact: data.analytics?.eyeContactScore > 70 ? 'Excellent' : 'Focus Needed',
            emotion: data.analytics?.emotionDetected || 'Neutral',
            posture: data.analytics?.postureScore > 80 ? 'Perfect' : 'Fixed'
          }));
        });

      } catch (err) {
        console.error('Interview initialization failed:', err);
        alert('Failed to initialize interview session. Please try again.');
        navigate('/app/interviews');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log(`[Media] Stopped track: ${track.kind}`);
        });
      }
      socketService.disconnect('/interview');
    };
  }, [type, user, navigate]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEnd = async () => {
    if (isEnding) return;
    try {
      setIsEnding(true);
      if (session) {
        await api.put(`/interviews/${session.id}/end`, {
          duration: 1800 - timeLeft,
          score: Math.round(analytics.confidence * 0.8 + 10),
          confidenceScore: analytics.confidence,
          transcript: transcript.join(' ')
        });
        navigate(`/app/interviews/report/${session.id}`);
      } else {
        navigate('/app/interviews');
      }
    } catch (err) {
      console.error('Failed to end interview', err);
      navigate('/app/interviews');
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setTranscript(prev => [...prev, `[AI] ${questions[nextIdx]}`]);
    } else {
      handleEnd();
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center space-y-6">
        <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold tracking-widest uppercase animate-pulse">Syncing Neural Link</h2>
          <p className="text-xs text-muted font-mono tracking-wider">Establishing encrypted stream with AI Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden text-white">
      {/* HUD Header */}
      <header className="h-16 bg-surface/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-red-500">Rec_Active</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3 text-primary">
            <Clock className="w-4 h-4 shadow-neon-cyan" />
            <span className="text-sm font-black font-mono tracking-widest">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-xl border border-white/5">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-400/80">Neural Safeguard Active</span>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full transition-all group">
            <Settings className="w-5 h-5 text-muted group-hover:text-white" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex p-6 gap-6 overflow-hidden">
        {/* Left: AI & Transcript */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* AI Interviewer Avatar/Panel */}
          <div className="flex-1 glass-card relative flex flex-col items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent -z-10" />
            
            {/* Pulsing AI Neural Visual */}
            <div className="relative">
              <motion.div 
                animate={{ scale: [1, 1.1, 1], rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="w-56 h-56 rounded-full border border-primary/20 flex items-center justify-center"
              >
                <div className="w-40 h-40 rounded-full border border-primary/40 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                </div>
              </motion.div>
              <BrainCircuit className="w-14 h-14 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-neon-cyan" />
              
              {/* Orbital Rings */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 -m-4 border-t-2 border-primary/10 rounded-full"
              />
            </div>

            <div className="mt-12 text-center max-w-xl px-12 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60">Neural Inquiry</span>
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  exit={{ opacity: 0, filter: 'blur(10px)', y: -20 }}
                  className="text-2xl font-bold tracking-tight leading-relaxed text-white drop-shadow-2xl"
                >
                  "{questions[currentQuestionIndex] || 'Processing neural logic tree...'}"
                </motion.h2>
              </AnimatePresence>
            </div>

            <button 
              onClick={nextQuestion}
              className="absolute bottom-8 right-8 flex items-center gap-3 px-6 py-3 bg-primary text-background rounded-2xl font-black text-xs tracking-widest hover:shadow-neon-cyan transition-all group"
            >
              CONTINUE SESSION
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Realtime Transcript */}
          <div className="h-48 glass-card p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-muted">
                <MessageSquare className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Transcription Stream</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
              </div>
            </div>
            <div className="space-y-4">
              {transcript.length > 0 ? (
                transcript.map((line, i) => (
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="text-sm font-medium leading-relaxed border-l-2 border-primary/20 pl-4 py-1"
                  >
                    <span className="text-[10px] uppercase font-black mr-2 opacity-40">T+{formatTime(1800 - timeLeft)}</span>
                    {line}
                  </motion.p>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 opacity-30 italic text-sm">
                  Awaiting vocal input for transcription...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Camera & HUD */}
        <div className="w-96 flex flex-col gap-6">
          {/* User Camera */}
          <div className="aspect-video glass-card relative group overflow-hidden border-2 border-white/5">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className={`w-full h-full object-cover scale-x-[-1] transition-all duration-700 ${!videoEnabled && 'grayscale blur-xl opacity-30'}`}
            />
            {!videoEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/50 backdrop-blur-sm">
                <VideoOff className="w-12 h-12 text-muted mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Neural Stream Halted</p>
              </div>
            )}
            
            {/* Camera Overlay HUD */}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-mono border border-white/10 uppercase tracking-tighter">
                Sbj_01 // <span className="text-primary">{user?.displayName?.split(' ')[0] || 'NEURAL_UNIT'}</span>
              </div>
            </div>

            <div className="absolute top-4 right-4 px-2 py-1 bg-primary/20 backdrop-blur-md rounded-lg text-[9px] font-mono border border-primary/30 uppercase tracking-tighter text-primary">
              Live // 1080p
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4">
              <button 
                onClick={() => setMicEnabled(!micEnabled)}
                className={`p-3.5 rounded-2xl backdrop-blur-2xl border transition-all ${micEnabled ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}
              >
                {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`p-3.5 rounded-2xl backdrop-blur-2xl border transition-all ${videoEnabled ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}
              >
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button 
                onClick={handleEnd}
                className="p-3.5 rounded-2xl bg-red-500 text-white border border-red-400/50 hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Realtime Analytics Dashboard */}
          <div className="flex-1 glass-card p-6 flex flex-col gap-8 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 rounded-full" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Biometric Sync</h4>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => <div key={i} className="w-0.5 h-2 bg-primary/30" />)}
                </div>
              </div>
              
              <div className="space-y-8">
                {/* Confidence Meter */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black uppercase tracking-widest text-muted">Neural Confidence</span>
                    <span className="text-2xl font-black text-primary drop-shadow-neon-cyan">{Math.round(analytics.confidence)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${analytics.confidence}%` }}
                      className="h-full bg-quantum-gradient shadow-neon-cyan"
                    />
                  </div>
                </div>

                {/* Biometric Status Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                    <Eye className="w-3.5 h-3.5 text-green-400 mb-2 opacity-50 group-hover:opacity-100" />
                    <p className="text-[9px] text-muted uppercase font-black tracking-tighter mb-1">Eye Contact</p>
                    <p className="text-sm font-black text-green-400">{analytics.eyeContact}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                    <Smile className="w-3.5 h-3.5 text-primary mb-2 opacity-50 group-hover:opacity-100" />
                    <p className="text-[9px] text-muted uppercase font-black tracking-tighter mb-1">Emotion</p>
                    <p className="text-sm font-black text-primary">{analytics.emotion}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                    <Activity className="w-3.5 h-3.5 text-secondary mb-2 opacity-50 group-hover:opacity-100" />
                    <p className="text-[9px] text-muted uppercase font-black tracking-tighter mb-1">Speech Rate</p>
                    <p className="text-sm font-black text-secondary">{analytics.clarity}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                    <Zap className="w-3.5 h-3.5 text-amber-400 mb-2 opacity-50 group-hover:opacity-100" />
                    <p className="text-[9px] text-muted uppercase font-black tracking-tighter mb-1">Posture</p>
                    <p className="text-sm font-black text-amber-400">{analytics.posture}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto p-5 bg-primary/10 border border-primary/20 rounded-2xl relative group hover:bg-primary/20 transition-all">
              <div className="absolute -top-2 -left-2 p-1.5 bg-primary rounded-lg shadow-neon-cyan">
                <BrainCircuit className="w-4 h-4 text-background" />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Neural Feedback</p>
                <p className="text-xs font-bold leading-relaxed text-white/90">"Maintain consistent eye contact while iterating through technical logic."</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveInterview;
