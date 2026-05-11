/**
 * LiveInterview — Orchestrator v6
 *
 * STT Architecture:
 *  - useSTT hook handles the entire speech pipeline (Deepgram → Web Speech)
 *  - getUserMedia requests VIDEO ONLY — no audio track conflict with Web Speech
 *  - Audio track is exclusively managed by useSTT
 */

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Clock, PhoneOff, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';
import { useFaceAnalytics } from '../components/interview/FaceAnalyticsEngine';
import { useSTT } from '../hooks/useSTT';

const InterviewHUD            = lazy(() => import('../components/interview/InterviewHUD'));
const HRInterviewPanel        = lazy(() => import('../components/interview/HRInterviewPanel'));
const TechnicalInterviewPanel = lazy(() => import('../components/interview/TechnicalInterviewPanel'));
const LiveCodingPanel         = lazy(() => import('../components/interview/LiveCodingPanel'));

const PanelLoader = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const LiveInterview = () => {

  const { id }      = useParams();
  const navigate    = useNavigate();
  const { search }  = useLocation();
  const params      = new URLSearchParams(search);
  const type        = params.get('type')       || 'behavioral';
  const role        = params.get('role')       || '';
  const difficulty  = params.get('difficulty') || 'Intermediate';
  const tone        = params.get('tone')       || 'professional';
  const durationSec = parseInt(params.get('duration') || '1800', 10);

  const { user } = useAuth();

  const renderCount = useRef(0);
  if (process.env.NODE_ENV === 'development') {
    renderCount.current++;
    // Uncomment to measure rerender storm:
    // console.log('[RENDER] LiveInterview:', renderCount.current);
  }

  // ── UI state ──────────────────────────────────────────────────────────
  const [questions,            setQuestions]            = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript,           setTranscript]           = useState([]);
  const [currentPartial,       setCurrentPartial]       = useState('');
  const [codingScore,          setCodingScore]          = useState(50);
  const [timeLeft,             setTimeLeft]             = useState(durationSec);
  const [micEnabled,           setMicEnabled]           = useState(true);
  const [videoEnabled,         setVideoEnabled]         = useState(true);
  const [webcamAvailable,      setWebcamAvailable]      = useState(false);
  const [isEnding,             setIsEnding]             = useState(false);
  const [loading,              setLoading]              = useState(true);
  const [sttStatus,            setSttStatus]            = useState('Initializing microphone...');
  const [isSpeaking,           setIsSpeaking]           = useState(false);
  const [authError,            setAuthError]            = useState(null);
  const [sttReady,             setSttReady]             = useState(false);

  // audioStream stored in a ref so changing it doesn't re-trigger useSTT's useEffect chain
  // (setting state causes a rerender which can recreate the STT hook context)
  const audioStreamRef = useRef(null);
  const [audioStreamState, setAudioStreamState] = useState(null); // only for passing to useSTT

  // ── Refs ──────────────────────────────────────────────────────────────
  const videoRef          = useRef(null);
  const streamRef         = useRef(null);
  const sessionRef        = useRef(null);
  const transcriptRef     = useRef([]);
  const analyticsRef      = useRef({});
  const analyticsTimerRef = useRef(null);
  const silenceTimerRef   = useRef(null);
  const deepgramRef       = useRef(null);
  const recognitionRef    = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const testSTTRef        = useRef(null);
  const isInitializingRef = useRef(false);
  const isEndingRef       = useRef(false);
  const destroyedRef      = useRef(false);
  const authErrorRef      = useRef(null);

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  const DISABLE_FACE_ANALYTICS = false; // Re-enabled: render storm fixed

  // ── Face analytics (video only) ───────────────────────────────────────
  useFaceAnalytics(videoRef, analyticsRef, webcamAvailable && !loading && !DISABLE_FACE_ANALYTICS);

  const formatTime = useCallback((s) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }, []);

  // ── Speech activity (silence detection) ──────────────────────────────
  const onSpeechActivity = useCallback((isFinal) => {
    clearTimeout(silenceTimerRef.current);
    setIsSpeaking(true);
    silenceTimerRef.current = setTimeout(
      () => setIsSpeaking(false),
      isFinal ? 3000 : 5000
    );
  }, []);

  // ── STT callbacks ─────────────────────────────────────────────────────
  const handlePartial = useCallback((text) => {
    setCurrentPartial(text);
    onSpeechActivity(false);
  }, [onSpeechActivity]);

  const handleFinal = useCallback((text) => {
    setTranscript(prev => {
      const updated = [...prev, `[Candidate] ${text}`].slice(-200);
      transcriptRef.current = updated;
      return updated;
    });
    setCurrentPartial('');
    onSpeechActivity(true);
    console.log('[STT] Transcript appended:', text);
  }, [onSpeechActivity]);

  const handleStatusChange = useCallback((status) => {
    setSttStatus(status);
  }, []);

  // ── useSTT hook ───────────────────────────────────────────────────────
  // Pass audioStreamState (stable ref-backed) so useSTT's lifecycle
  // doesn't re-fire on every parent rerender
  const sttResult = useSTT({
    audioStream:    audioStreamState,
    onPartial:      handlePartial,
    onFinal:        handleFinal,
    onStatusChange: handleStatusChange,
    onSpeechActivity,
    enabled:        sttReady && !loading,
  });

  // Store stopSTT in a ref so teardown/handleEnd don't need it as a dep
  const stopSTTRef = useRef(null);
  stopSTTRef.current = sttResult.stopAll;

  // ── Analytics persistence ─────────────────────────────────────────────
  const persistAnalytics = useCallback(async () => {
    const sid = sessionRef.current?.id;
    if (!sid) return;
    try {
      const snap = analyticsRef.current || {};
      await api.post(`/interviews/${sid}/analytics`, {
        eyeContactScore:    snap.eyeContactScore    ?? null,
        nervousnessScore:   snap.nervousnessScore   ?? null,
        emotionDetected:    snap.emotionDetected     ?? null,
        smileFrequency:     snap.smileFrequency      ?? null,
        attentionStability: snap.attentionStability  ?? null,
      });
    } catch (err) { 
      console.error('[InterviewError] persistAnalytics failed:', err); 
    }
  }, []);

  // ── Full teardown ─────────────────────────────────────────────────────
  const teardown = useCallback(() => {
    console.log('[INTERVIEW CLEANUP] Starting teardown...');
    destroyedRef.current = true;
    clearInterval(analyticsTimerRef.current);
    clearTimeout(silenceTimerRef.current);

    stopSTTRef.current?.();

    // Video stream (face analytics)
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach(t => {
        t.stop();
        console.log('[INTERVIEW CLEANUP] webcam track stopped:', t.label);
      });
      streamRef.current = null;
    }

    // Audio stream (STT)
    const a = audioStreamRef.current;
    if (a) {
      a.getTracks().forEach(t => {
        t.stop();
        console.log('[INTERVIEW CLEANUP] audio track stopped:', t.label);
      });
      audioStreamRef.current = null;
    }

    if (videoRef.current) videoRef.current.srcObject = null;

    try {
      socketService.disconnect('/interview');
      console.log('[INTERVIEW CLEANUP] socket disconnected');
    } catch (err) {
      console.error('[InterviewError] socket disconnect failed:', err);
    }
    console.log('[INTERVIEW CLEANUP] Teardown complete');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No deps — uses refs only, never needs to be recreated

  // ── Init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    destroyedRef.current = false;
    authErrorRef.current = null;

    const init = async () => {
      try {
        console.log('[InterviewInit] Starting STT init block...');
        setLoading(true);

        // Auth guard
        if (!user) {
          authErrorRef.current = 'Not authenticated.';
          setAuthError('Not authenticated. Please log in again.');
          setLoading(false);
          return;
        }

        try {
          const { getIdToken } = await import('firebase/auth');
          const { auth } = await import('../services/firebase');
          if (auth.currentUser) await getIdToken(auth.currentUser, false);
          console.log('[AUTH] Token ready ✓');
        } catch (e) {
          console.warn('[AUTH] Token pre-flight failed:', e.message);
        }

        // 1. Session
        const sessionRes = await api.post('/interviews', {
          interviewType: type, difficulty, role: role || undefined,
        });
        const sessionData = sessionRes?.data;
        if (!sessionData?.id) throw new Error('Failed to create interview session');
        sessionRef.current = sessionData;
        console.log('[Interview] Session created:', sessionData.id);

        // 2. Questions
        try {
          const qRes = await api.post('/interviews/questions', {
            interviewType: type, difficulty, role: role || undefined, count: 5,
          });
          if (!destroyedRef.current) setQuestions(qRes?.data?.questions || getFallbackQuestions(type));
        } catch (err) {
          console.error('[InterviewError] Failed to fetch questions:', err);
          if (!destroyedRef.current) setQuestions(getFallbackQuestions(type));
        }

        // 3. VIDEO ONLY stream for face analytics
        //    Audio is handled exclusively by useSTT to avoid mic conflicts
        try {
          console.log('[Media] Requesting video stream (face analytics)...');
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, facingMode: 'user' },
            audio: false,  // ← CRITICAL: no audio here — Web Speech manages mic
          });
          streamRef.current = videoStream;
          if (!destroyedRef.current) setWebcamAvailable(true);
          if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
            videoRef.current.play().catch(() => {});
          }
          console.log('[Media] Video stream active ✓');
        } catch (camErr) {
          console.warn('[Media] Camera denied:', camErr.message, '— continuing without webcam');
          if (!destroyedRef.current) setWebcamAvailable(false);
        }

        // 4. Separate AUDIO stream for STT (useSTT hook handles this)
        //    We acquire it here so we control the lifecycle, but pass it to useSTT
        let audioOnlyStream = null;
        try {
          console.log('[STT] Requesting audio-only stream for STT...');
          audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation:  true,
              noiseSuppression:  true,
              autoGainControl:   true,
            },
            video: false,
          });
          const track = audioOnlyStream.getAudioTracks()[0];
          console.log('[STT] Audio stream acquired ✓ | track:', track?.label, '| readyState:', track?.readyState);
          if (!destroyedRef.current) {
            audioStreamRef.current = audioOnlyStream;
            setAudioStreamState(audioOnlyStream);
            setSttReady(true);
          }
        } catch (micErr) {
          console.error('[STT] Mic denied:', micErr.message);
          setSttStatus('🔴 Mic permission denied — grant in browser settings');
        }

        // 5. Socket
        try {
          const sock = socketService.getSocket('/interview', { userId: user?.uid || user?.id });
          sock.emit('interview:start', { interviewId: sessionData.id, userId: user?.uid || user?.id });
        } catch (err) { 
          console.error('[InterviewError] Socket emit failed:', err); 
        }

        // 6. Analytics heartbeat
        analyticsTimerRef.current = setInterval(persistAnalytics, 30000);
        console.log('[Interview] Init complete ✓');
      } catch (err) {
        const msg    = err?.response?.data?.error || err?.message || 'Unknown error';
        const status = err?.response?.status;
        console.error('[Interview] Init failed:', status, msg);
        if (!destroyedRef.current) {
          const errMsg = status === 401
            ? 'Session expired. Please go back and log in again.'
            : `Initialization failed: ${msg}`;
          authErrorRef.current = errMsg;
          setAuthError(errMsg);
          setLoading(false);
        }
      } finally {
        if (!destroyedRef.current && !authErrorRef.current) setLoading(false);
      }
    };

    init();
    return () => {
      isInitializingRef.current = false;
      teardown();
    };
  // teardown is now stable (no deps), user/type are stable during a session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && sessionRef.current && !isEndingRef.current) handleEnd();
  }, [timeLeft]); // eslint-disable-line

  // ── End session ───────────────────────────────────────────────────────
  // timeLeft stored in a ref so handleEnd doesn't need to change identity every second
  const timeLeftRef = useRef(durationSec);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const handleEnd = useCallback(async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    setIsEnding(true);

    const sid  = sessionRef.current?.id;
    const snap = analyticsRef.current || {};
    const tx   = transcriptRef.current;
    const tl   = timeLeftRef.current;

    stopSTTRef.current?.();

    const s = streamRef.current;
    if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null; }

    const a = audioStreamRef.current;
    if (a) { a.getTracks().forEach(t => t.stop()); audioStreamRef.current = null; }
    setAudioStreamState(null);

    if (videoRef.current) videoRef.current.srcObject = null;

    if (!sid) { navigate('/app/interviews'); return; }

    try {
      await api.post(`/interviews/${sid}/analytics/final`, {
        eyeContactScore:    snap.eyeContactScore    ?? null,
        nervousnessScore:   snap.nervousnessScore   ?? null,
        emotionDetected:    snap.emotionDetected     ?? null,
        smileFrequency:     snap.smileFrequency      ?? null,
        attentionStability: snap.attentionStability  ?? null,
      });

      const totalScore = Math.round(
        (snap.eyeContactScore    ?? 60) * 0.25 +
        (snap.attentionStability ?? 60) * 0.25 +
        codingScore * 0.25 +
        (snap.confidenceScore    ?? 60) * 0.25
      );

      await api.put(`/interviews/${sid}/end`, {
        duration:        durationSec - tl,
        score:           totalScore,
        confidenceScore: snap.confidenceScore ?? null,
        codingScore:     type === 'coding' ? codingScore : null,
        transcript:      tx.join('\n').slice(0, 5000),
      });

      navigate('/app/interviews/analytics');
    } catch (err) {
      console.error('[Interview] End session failed:', err.message);
      navigate('/app/interviews');
    }
  // codingScore/durationSec/type/navigate are stable for the session lifetime
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codingScore]);

  // ── Question navigation ───────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    if (isSpeaking) return;
    if (currentQuestionIndex < questions.length - 1) {
      const next = currentQuestionIndex + 1;
      setCurrentQuestionIndex(next);
      const q = questions[next];
      setTranscript(prev => [...prev, `[AI] ${typeof q === 'object' ? q.question : q}`].slice(-200));
    } else {
      handleEnd();
    }
  }, [currentQuestionIndex, questions, handleEnd, isSpeaking]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(i => i - 1);
  }, [currentQuestionIndex]);


  // ── Render: loading ───────────────────────────────────────────────────
  if (loading) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center space-y-6">
      <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold tracking-widest uppercase animate-pulse">Syncing Neural Link</h2>
        <p className="text-xs text-muted font-mono tracking-wider">Establishing encrypted stream...</p>
      </div>
    </div>
  );

  // ── Render: auth error ────────────────────────────────────────────────
  if (authError) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center space-y-6 text-white p-8">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <PhoneOff className="w-8 h-8 text-red-400" />
      </div>
      <div className="text-center space-y-3 max-w-md">
        <h2 className="text-2xl font-black tracking-tight uppercase">Session Error</h2>
        <p className="text-sm text-muted font-medium leading-relaxed">{authError}</p>
      </div>
      <button
        onClick={() => navigate('/app/interviews')}
        className="px-6 py-3 bg-primary text-background font-black text-sm uppercase tracking-widest rounded-xl hover:shadow-neon-cyan transition-all"
      >
        Return to Interview Hub
      </button>
    </div>
  );

  // ── Render: main ──────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden text-white">
      {/* Header */}
      <header className="h-14 bg-surface/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-50 flex-shrink-0">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-red-500">Live</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-primary">
            <Clock className="w-4 h-4" />
            <span className={`text-sm font-black font-mono tracking-widest ${timeLeft < 300 ? 'text-red-400 animate-pulse' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          {isSpeaking && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Speaking</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-xl border border-white/5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-400/80">Neural Safeguard</span>
          </div>

          {role && (
            <div className="px-3 py-1 bg-primary/10 rounded-xl border border-primary/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">{role}</span>
            </div>
          )}

          {sttStatus && (
            <div className={`px-3 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest truncate max-w-[180px] ${
              sttStatus.includes('Listening') || sttStatus.includes('Deepgram') || sttStatus.includes('received')
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : sttStatus.includes('🔴') || sttStatus.includes('denied') || sttStatus.includes('error')
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {sttStatus}
            </div>
          )}

          <button
            onClick={handleEnd}
            disabled={isEnding}
            className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            {isEnding ? 'Ending...' : 'End Session'}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex p-5 gap-5 overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">
          <Suspense fallback={<PanelLoader />}>
            {type === 'coding' ? (
              <LiveCodingPanel
                interviewId={sessionRef.current?.id}
                currentQuestion={questions[currentQuestionIndex]}
                selectedLanguage="python"
                onScoreUpdate={setCodingScore}
                onNextQuestion={nextQuestion}
                questionIndex={currentQuestionIndex}
                totalQuestions={questions.length}
              />
            ) : type === 'behavioral' || type === 'hr' ? (
              <HRInterviewPanel
                questions={questions}
                currentIndex={currentQuestionIndex}
                onNext={nextQuestion}
                onPrev={prevQuestion}
                transcript={transcript}
                currentPartial={currentPartial}
                formatTime={formatTime}
                timeLeft={timeLeft}
                tone={tone}
                isSpeaking={isSpeaking}
              />
            ) : (
              <TechnicalInterviewPanel
                questions={questions}
                currentIndex={currentQuestionIndex}
                onNext={nextQuestion}
                onPrev={prevQuestion}
                transcript={transcript}
                currentPartial={currentPartial}
                formatTime={formatTime}
                timeLeft={timeLeft}
                role={role}
                difficulty={difficulty}
                isSpeaking={isSpeaking}
              />
            )}
          </Suspense>
        </div>

        <Suspense fallback={<PanelLoader />}>
          <InterviewHUD
            videoRef={videoRef}
            streamRef={streamRef}
            analyticsRef={analyticsRef}
            micEnabled={micEnabled}
            videoEnabled={videoEnabled}
            onToggleMic={() => setMicEnabled(v => !v)}
            onToggleVideo={() => setVideoEnabled(v => !v)}
            user={user}
            webcamAvailable={webcamAvailable}
            timeLeft={timeLeft}
            formatTime={formatTime}
            sttStatus={sttStatus}
          />
        </Suspense>

      </main>
    </div>
  );
};

// ─── Fallback question banks ──────────────────────────────────────────────────
function getFallbackQuestions(type) {
  const banks = {
    coding:       [
      { question: 'Reverse a linked list in O(n) time.', topic: 'Linked Lists', difficulty: 'Intermediate' },
      { question: 'Find the longest substring without repeating characters.', topic: 'Sliding Window', difficulty: 'Intermediate' },
      { question: 'Implement a valid parentheses checker.', topic: 'Stacks', difficulty: 'Beginner' },
    ],
    technical:    [
      { question: 'Explain the difference between REST and GraphQL.', topic: 'API Design' },
      { question: 'What are SOLID principles?', topic: 'Design Patterns' },
      { question: 'How does a hash table work internally?', topic: 'Data Structures' },
      { question: 'What is the CAP theorem?', topic: 'Distributed Systems' },
      { question: 'Explain event loop in Node.js.', topic: 'Runtime' },
    ],
    behavioral:   [
      { question: 'Tell me about yourself and your background.' },
      { question: 'Describe a challenging project you worked on.' },
      { question: 'How do you handle disagreements with team members?' },
      { question: 'Tell me about a time you failed and what you learned.' },
      { question: 'How do you prioritize work under pressure?' },
    ],
    hr:           [
      { question: 'Why do you want to work at our company?' },
      { question: 'What motivates you professionally?' },
      { question: 'Describe your ideal work environment.' },
      { question: 'Where do you see yourself in 5 years?' },
      { question: 'What are your salary expectations?' },
    ],
    system_design:[
      { question: 'Design a URL shortener like bit.ly.', topic: 'System Design' },
      { question: 'How would you design a real-time chat application?', topic: 'Scalability' },
      { question: 'Design a notification service.', topic: 'Architecture' },
    ],
  };
  return banks[type] || banks.behavioral;
}

export default LiveInterview;
