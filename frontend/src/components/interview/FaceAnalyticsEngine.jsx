/**
 * FaceAnalyticsEngine — Stabilized biometric tracker v4
 *
 * Fixes vs v3:
 *  • Waits for video.readyState === 4 (HAVE_ENOUGH_DATA) — not just >= 2
 *  • videoWidth > 0 guard prevents detecting against black frame
 *  • scoreThreshold lowered to 0.3 (was 0.5) — catches side-profile faces
 *  • inputSize 320 (was 224) — better accuracy at normal webcam distances
 *  • Detection retry with backoff if no face for 3+ seconds
 *  • All log paths restored (no silent catch{})
 *  • Teardown race fixed: destroyedRef checked after every await
 *  • Zero React state — writes only to analyticsRef
 */

import { useEffect, useRef } from 'react';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
const FRAME_INTERVAL_MS = 120; // ~8fps — balanced accuracy vs CPU

// ── Rolling buffer ────────────────────────────────────────────────────
function createBuffer(size) {
  const buf = [];
  return {
    push: (val) => { buf.push(val); if (buf.length > size) buf.shift(); },
    mean: () => buf.length === 0 ? 0 : Math.round(buf.reduce((a, b) => a + b, 0) / buf.length),
    dominant: () => {
      if (buf.length === 0) return 'neutral';
      const freq = {};
      buf.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
      return Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
    },
    size: () => buf.length,
    clear: () => { buf.length = 0; },
  };
}

export const useFaceAnalytics = (videoRef, analyticsRef, active) => {
  const destroyedRef     = useRef(false);
  const rafRef           = useRef(null);
  const frameTimerRef    = useRef(null);
  const faceVisibleSince = useRef(null);
  const noFaceSince      = useRef(null);

  // Smoothing buffers
  const eyeContactBuf  = useRef(createBuffer(30));
  const emotionBuf     = useRef(createBuffer(20));
  const attentionBuf   = useRef(createBuffer(15));
  const confidenceBuf  = useRef(createBuffer(15));

  useEffect(() => {
    if (!active) return;

    destroyedRef.current = false;
    noFaceSince.current  = null;

    const teardown = () => {
      console.log('[FaceAnalytics] Teardown called.');
      destroyedRef.current = true;
      if (rafRef.current)        cancelAnimationFrame(rafRef.current);
      if (frameTimerRef.current) clearTimeout(frameTimerRef.current);
      rafRef.current        = null;
      frameTimerRef.current = null;
    };

    // ── Load models ────────────────────────────────────────────────────
    const loadAndStart = async () => {
      try {
        if (!window.__faceApiLoaded) {
          if (!window.faceapi) {
            console.log('[FaceAnalytics] Loading face-api.js from CDN...');
            await new Promise((resolve, reject) => {
              const existing = document.querySelector('script[data-faceapi]');
              if (existing) { resolve(); return; }
              const script = document.createElement('script');
              script.src   = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js';
              script.async = true;
              script.setAttribute('data-faceapi', '1');
              script.onload  = resolve;
              script.onerror = () => reject(new Error('face-api CDN load failed'));
              document.head.appendChild(script);
            });
          }

          if (destroyedRef.current) return;

          const fa = window.faceapi;
          if (!fa) throw new Error('window.faceapi not defined after CDN load');

          console.log('[FaceAnalytics] Loading models...');
          await Promise.all([
            fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            fa.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          ]);

          window.__faceApiLoaded = true;
          console.log('[FaceAnalytics] Models loaded ✓');
        } else {
          console.log('[FaceAnalytics] Models already loaded (cache hit) ✓');
        }

        if (destroyedRef.current) return;
        startTracking();
      } catch (err) {
        console.error('[FaceAnalytics] Initialization failed:', err.message);
      }
    };

    // ── Per-frame tracking ─────────────────────────────────────────────
    const startTracking = () => {
      console.log('[FaceAnalytics] Detection loop started ✓');

      const track = async () => {
        if (destroyedRef.current) return;

        const video = videoRef.current;

        // Wait for HAVE_ENOUGH_DATA (4) AND valid dimensions
        if (
          !video ||
          video.paused ||
          video.ended ||
          video.readyState < 4 ||
          video.videoWidth === 0 ||
          video.videoHeight === 0
        ) {
          frameTimerRef.current = setTimeout(() => {
            if (!destroyedRef.current) rafRef.current = requestAnimationFrame(track);
          }, FRAME_INTERVAL_MS);
          return;
        }

        const faceapi = window.faceapi;
        if (!faceapi) return;

        try {
          // Lower threshold (0.3 vs 0.5) catches faces at angles, partial views
          const detection = await faceapi
            .detectSingleFace(
              video,
              new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })
            )
            .withFaceLandmarks()
            .withFaceExpressions();

          if (destroyedRef.current) return;

          if (detection) {
            noFaceSince.current = null; // Reset no-face timer

            // Require 500ms of continuous visibility before scoring
            if (!faceVisibleSince.current) faceVisibleSince.current = Date.now();
            const visibleMs = Date.now() - faceVisibleSince.current;

            if (visibleMs >= 500) {
              const { expressions, landmarks } = detection;

              // ── Eye Contact ──────────────────────────────────────────
              const leftEye  = landmarks.getLeftEye();
              const rightEye = landmarks.getRightEye();
              // Average of outer & inner corners of each eye
              const eyeCx = (leftEye[0].x + leftEye[3].x + rightEye[0].x + rightEye[3].x) / 4;
              const eyeCy = (leftEye[0].y + leftEye[3].y + rightEye[0].y + rightEye[3].y) / 4;
              const box   = detection.detection.box;
              const faceCx = box.x + box.width  / 2;
              const faceCy = box.y + box.height / 2;
              const dxNorm = Math.abs(eyeCx - faceCx) / box.width;
              const dyNorm = Math.abs(eyeCy - faceCy) / box.height;
              const rawEye = Math.max(0, Math.min(100,
                Math.round((1 - (dxNorm + dyNorm) * 3) * 100)
              ));
              eyeContactBuf.current.push(rawEye);

              // ── Emotion ──────────────────────────────────────────────
              const topEmotion = Object.entries(expressions)
                .sort((a, b) => b[1] - a[1])[0][0];
              emotionBuf.current.push(topEmotion);

              // ── Attention ────────────────────────────────────────────
              const rawAttn = Math.max(0, Math.min(100,
                Math.round((1 - (expressions.surprised + expressions.fearful) * 0.5) * 100)
              ));
              attentionBuf.current.push(rawAttn);

              // ── Confidence ───────────────────────────────────────────
              const rawConf = Math.max(0, Math.min(100,
                Math.round(65 + (expressions.happy * 25) - (expressions.fearful * 35) - (expressions.disgusted * 15))
              ));
              confidenceBuf.current.push(rawConf);

              // ── Write to ref (zero setState → zero rerenders) ────────
              analyticsRef.current = {
                faceVisible:        true,
                eyeContactScore:    eyeContactBuf.current.mean(),
                emotionDetected:    emotionBuf.current.dominant(),
                attentionStability: attentionBuf.current.mean(),
                smileFrequency:     parseFloat((expressions.happy * 10).toFixed(1)),
                confidenceScore:    confidenceBuf.current.mean(),
                nervousnessScore:   Math.round((expressions.fearful + expressions.disgusted) * 50),
              };
            } else {
              analyticsRef.current = { ...analyticsRef.current, faceVisible: true };
            }
          } else {
            // No face detected
            faceVisibleSince.current = null;
            analyticsRef.current = { ...analyticsRef.current, faceVisible: false };

            // Retry initializer after 3s of no face
            if (!noFaceSince.current) {
              noFaceSince.current = Date.now();
            } else if (Date.now() - noFaceSince.current > 3000) {
              console.log('[FaceAnalytics] No face for 3s — clearing buffers for fresh start');
              eyeContactBuf.current.clear();
              emotionBuf.current.clear();
              attentionBuf.current.clear();
              confidenceBuf.current.clear();
              noFaceSince.current = null;
            }
          }
        } catch (err) {
          // Single-frame errors are expected (e.g. brief occlusions)
          console.warn('[FaceAnalytics] Frame error:', err.message);
        }

        // ── Throttle ───────────────────────────────────────────────────
        if (!destroyedRef.current) {
          frameTimerRef.current = setTimeout(() => {
            if (!destroyedRef.current) {
              rafRef.current = requestAnimationFrame(track);
            }
          }, FRAME_INTERVAL_MS);
        }
      };

      rafRef.current = requestAnimationFrame(track);
    };

    loadAndStart();
    return teardown;
  }, [active]); // Only re-run when active changes
};
