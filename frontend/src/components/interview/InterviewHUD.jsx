/**
 * InterviewHUD — Stabilized webcam + biometrics panel v3.
 *
 * Key fixes:
 *  • Accepts streamRef (ref object) instead of stream (state) — no re-render cascade
 *  • Uses callback ref on <video> to attach stream the moment the element mounts
 *  • onloadedmetadata ensures play() only fires when video is actually ready
 *  • Polls analyticsRef every 2s for display — no per-frame rerenders
 *  • Graceful "Biometric tracking disabled" when webcam denied
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Smile, Activity, Video, VideoOff, Mic, MicOff, Brain } from 'lucide-react';

const MetricRow = ({ label, value, color = 'text-primary', barColor = 'bg-primary', pct }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted">{label}</span>
      <span className={`text-xs font-black ${color}`}>{value}</span>
    </div>
    {pct !== undefined && (
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className={`h-full ${barColor} rounded-full`}
        />
      </div>
    )}
  </div>
);

const InterviewHUD = ({
  videoRef,
  streamRef,       // ref object — not state
  analyticsRef,
  micEnabled,
  videoEnabled,
  onToggleMic,
  onToggleVideo,
  user,
  webcamAvailable = false,
  timeLeft,
  formatTime,
  sttStatus = '',          // STT engine status string from LiveInterview
}) => {
  const [display, setDisplay] = useState({
    eyeContactScore:    0,
    confidenceScore:    75,
    attentionStability: 0,
    smileFrequency:     0,
    emotionDetected:    'Neutral',
    faceVisible:        false,
  });

  // Poll analyticsRef every 2s — avoids rerenders on every frame
  useEffect(() => {
    const interval = setInterval(() => {
      if (analyticsRef?.current && Object.keys(analyticsRef.current).length > 0) {
        setDisplay(prev => ({ ...prev, ...analyticsRef.current }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [analyticsRef]);

  // Callback ref: attaches stream the moment the video element mounts
  const videoCallbackRef = useCallback((videoEl) => {
    if (!videoEl) return;

    // Assign to the forwarded ref so FaceAnalyticsEngine can access it
    if (videoRef) videoRef.current = videoEl;

    const attachStream = () => {
      const s = streamRef?.current;
      if (s && videoEl.srcObject !== s) {
        videoEl.srcObject = s;
        videoEl.onloadedmetadata = () => {
          videoEl.play().catch(e => console.warn('[HUD] play() blocked:', e));
        };
      }
    };

    attachStream();

    // Also poll every 500ms in case stream arrives after element mounts
    const poll = setInterval(() => {
      if (streamRef?.current && videoEl.srcObject !== streamRef.current) {
        attachStream();
        clearInterval(poll);
      }
    }, 500);

    // Clear poll after 10s max
    setTimeout(() => clearInterval(poll), 10000);
  }, [streamRef, videoRef]);

  const emotionColor = {
    happy:     'text-green-400',
    neutral:   'text-primary',
    surprised: 'text-yellow-400',
    fearful:   'text-orange-400',
    sad:       'text-blue-400',
    disgusted: 'text-red-400',
    angry:     'text-red-500',
  }[display.emotionDetected?.toLowerCase()] || 'text-primary';

  const nudge = !webcamAvailable
    ? 'Enable webcam for biometric tracking.'
    : !display.faceVisible
    ? 'Position your face in the camera frame.'
    : display.eyeContactScore < 50
    ? 'Maintain eye contact with the interviewer.'
    : display.confidenceScore < 60
    ? 'Speak with more authority — you have this.'
    : 'Great presence — keep it consistent.';

  return (
    <div className="flex flex-col gap-4" style={{ width: '340px', flexShrink: 0 }}>
      {/* Webcam feed */}
      <div className="aspect-video glass-card relative group overflow-hidden border-2 border-white/5 rounded-2xl bg-surface">
        {webcamAvailable ? (
          <>
            <video
              ref={videoCallbackRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover scale-x-[-1] transition-all duration-700 ${!videoEnabled ? 'grayscale blur-xl opacity-30' : ''}`}
            />
            {!videoEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/50 backdrop-blur-sm">
                <VideoOff className="w-10 h-10 text-muted mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Stream Paused</p>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-md">
            <VideoOff className="w-10 h-10 text-muted mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/80">Biometric Tracking Disabled</p>
            <p className="text-[9px] text-muted mt-1">Grant camera permission to enable</p>
          </div>
        )}

        {/* Overlays */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-mono border border-white/10">
          <span className="text-muted">Sbj_01 // </span>
          <span className="text-primary">{user?.displayName?.split(' ')[0] || 'CANDIDATE'}</span>
        </div>
        <div className={`absolute top-3 right-3 px-2 py-1 backdrop-blur-md rounded-lg text-[9px] font-mono border uppercase ${webcamAvailable ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
          {webcamAvailable ? 'Live' : 'Offline'}
        </div>

        {/* Face indicator */}
        {webcamAvailable && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${display.faceVisible ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-[9px] text-muted font-mono">{display.faceVisible ? 'Face detected' : 'No face'}</span>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button onClick={onToggleMic} className={`p-2.5 rounded-xl backdrop-blur-2xl border transition-all ${micEnabled ? 'bg-white/5 border-white/10' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
            {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          <button onClick={onToggleVideo} className={`p-2.5 rounded-xl backdrop-blur-2xl border transition-all ${videoEnabled ? 'bg-white/5 border-white/10' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
            {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Biometrics */}
      <div className="flex-1 glass-card p-5 flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -z-10" />

        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Biometric Sync</h4>
          <div className="flex gap-1">
            {[1,2,3,4].map(i => <div key={i} className="w-0.5 h-2 bg-primary/30 rounded" />)}
          </div>
        </div>

        <div className="space-y-4">
          <MetricRow label="Eye Contact"   value={webcamAvailable ? `${display.eyeContactScore}%`    : 'N/A'} color="text-green-400"   barColor="bg-green-400"   pct={webcamAvailable ? display.eyeContactScore    : 0} />
          <MetricRow label="Attention"     value={webcamAvailable ? `${display.attentionStability}%` : 'N/A'} color="text-primary"     barColor="bg-primary"     pct={webcamAvailable ? display.attentionStability : 0} />
          <MetricRow label="Confidence"    value={webcamAvailable ? `${display.confidenceScore}%`    : 'N/A'} color="text-secondary"   barColor="bg-secondary"   pct={webcamAvailable ? display.confidenceScore    : 0} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <Smile className="w-3 h-3 text-primary mb-1.5 opacity-60" />
            <p className="text-[9px] text-muted uppercase font-black tracking-tight mb-1">Emotion</p>
            <p className={`text-xs font-black capitalize ${emotionColor}`}>
              {webcamAvailable ? (display.emotionDetected || 'Neutral') : 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <Activity className="w-3 h-3 text-secondary mb-1.5 opacity-60" />
            <p className="text-[9px] text-muted uppercase font-black tracking-tight mb-1">Smiles/min</p>
            <p className="text-xs font-black text-secondary">
              {webcamAvailable ? (display.smileFrequency?.toFixed(1) ?? '0.0') : 'N/A'}
            </p>
          </div>
        </div>

        <div className="mt-auto p-3.5 bg-primary/10 border border-primary/20 rounded-xl relative">
          <div className="absolute -top-2 -left-2 p-1 bg-primary rounded-lg shadow-neon-cyan">
            <Brain className="w-3 h-3 text-background" />
          </div>
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] mb-1">Neural Feedback</p>
          <p className="text-[10px] font-medium leading-relaxed text-white/80">{nudge}</p>
        </div>

        {/* STT Status Panel */}
        <div className={`p-3 rounded-xl border flex items-center gap-2 ${
          sttStatus.includes('Listening') || sttStatus.includes('Deepgram')
            ? 'bg-green-500/10 border-green-500/20'
            : sttStatus.includes('denied') || sttStatus.includes('unavailable') || sttStatus.includes('🔴')
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-amber-500/10 border-amber-500/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            sttStatus.includes('Listening') || sttStatus.includes('Deepgram')
              ? 'bg-green-400 animate-pulse'
              : sttStatus.includes('denied') || sttStatus.includes('unavailable') || sttStatus.includes('🔴')
              ? 'bg-red-400'
              : 'bg-amber-400 animate-pulse'
          }`} />
          <p className={`text-[9px] font-black uppercase tracking-widest truncate ${
            sttStatus.includes('Listening') || sttStatus.includes('Deepgram')
              ? 'text-green-400'
              : sttStatus.includes('denied') || sttStatus.includes('unavailable') || sttStatus.includes('🔴')
              ? 'text-red-400'
              : 'text-amber-400'
          }`}>
            {sttStatus || 'Initializing voice...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InterviewHUD);
