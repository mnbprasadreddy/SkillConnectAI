/**
 * useSTT — Speech-to-Text hook v8
 *
 * Critical fixes vs v7:
 *  1. ALL engine functions stored in refs, NOT useCallback deps — eliminates
 *     the callback-recreation cascade that caused the useEffect to re-fire
 *     and destroy/restart the STT engine on every parent render.
 *  2. Web Speech fallback no longer stops audio tracks — it uses the Web
 *     Speech API's own mic access (no getUserMedia call needed for Web Speech).
 *     The audio stream is only used for the energy monitor + Deepgram path.
 *  3. activeStreamRef identity check moved inside the start ref function so
 *     it is always operating on the latest stream without stale closure issues.
 *  4. startDeepgram no longer depends on startWebSpeech — circular dep removed.
 *  5. Simplified lifecycle: useEffect only depends on [enabled, audioStream].
 */

import { useRef, useCallback, useEffect } from 'react';
import api from '../services/api';

const logSTT = (msg, data) => {
  if (data !== undefined) {
    console.log(`[STT ${Date.now()}] ${msg}`, data);
  } else {
    console.log(`[STT ${Date.now()}] ${msg}`);
  }
};

function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
}

export function useSTT({
  audioStream,
  onPartial,
  onFinal,
  onStatusChange,
  onSpeechActivity,
  enabled = false,
}) {
  // Engine refs
  const recognitionRef   = useRef(null);
  const deepgramWsRef    = useRef(null);
  const mediaRecorderRef = useRef(null);

  // State-machine refs
  const destroyedRef    = useRef(false);
  const startedRef      = useRef(false);
  const activeStreamRef = useRef(null);
  const engineRef       = useRef('none');
  const restartCountRef = useRef(0);
  const restartTimerRef = useRef(null);

  // Energy monitor refs
  const audioCtxRef    = useRef(null);
  const micIntervalRef = useRef(null);
  const lastStatusRef  = useRef('');

  // Stable callback refs — always points to latest without recreating functions
  const onPartialRef        = useRef(onPartial);
  const onFinalRef          = useRef(onFinal);
  const onStatusChangeRef   = useRef(onStatusChange);
  const onSpeechActivityRef = useRef(onSpeechActivity);

  useEffect(() => { onPartialRef.current        = onPartial;        }, [onPartial]);
  useEffect(() => { onFinalRef.current          = onFinal;          }, [onFinal]);
  useEffect(() => { onStatusChangeRef.current   = onStatusChange;   }, [onStatusChange]);
  useEffect(() => { onSpeechActivityRef.current = onSpeechActivity; }, [onSpeechActivity]);

  // Deduplicated status setter (ref-based — never changes identity)
  const setStatus = useCallback((s) => {
    if (lastStatusRef.current === s) return;
    lastStatusRef.current = s;
    onStatusChangeRef.current?.(s);
  }, []);

  // ── Energy monitor ─────────────────────────────────────────────────────
  // READ-ONLY from stream, never stops tracks
  const monitorMicEnergyRef = useRef(null);
  monitorMicEnergyRef.current = (stream) => {
    if (!stream || stream.getAudioTracks().length === 0) return;
    try {
      // Close any existing context
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      clearInterval(micIntervalRef.current);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      const source   = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      audioCtxRef.current = audioCtx;

      const data = new Uint8Array(analyser.frequencyBinCount);
      let wasSilent = true;

      micIntervalRef.current = setInterval(() => {
        if (destroyedRef.current) return;
        analyser.getByteTimeDomainData(data);
        let sq = 0;
        for (let i = 0; i < data.length; i++) {
          const n = (data[i] / 128.0) - 1.0;
          sq += n * n;
        }
        const rms = Math.sqrt(sq / data.length);
        if (rms > 0.04 && wasSilent) {
          wasSilent = false;
          logSTT('Mic energy detected', { rms: rms.toFixed(3) });
        } else if (rms <= 0.04 && !wasSilent) {
          wasSilent = true;
        }
      }, 500);
    } catch (err) {
      logSTT('AudioContext init failed:', err.message);
    }
  };

  // ── Full stop ──────────────────────────────────────────────────────────
  const stopAllRef = useRef(null);
  stopAllRef.current = () => {
    logSTT('stopAll() called');
    destroyedRef.current = true;
    startedRef.current   = false;
    activeStreamRef.current = null;

    clearInterval(micIntervalRef.current);
    clearTimeout(restartTimerRef.current);
    micIntervalRef.current  = null;
    restartTimerRef.current = null;

    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;

    try {
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch {}
    mediaRecorderRef.current = null;

    try {
      if (deepgramWsRef.current) {
        deepgramWsRef.current.onclose = null;
        deepgramWsRef.current.close();
        deepgramWsRef.current = null;
      }
    } catch {}

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
    } catch (err) {
      logSTT('recognition.abort() failed:', err.message);
    }

    setStatus('⏹ Stopped');
    logSTT('All engines stopped');
  };

  // Stable wrapper so consumers can call stopAll without re-renders
  const stopAll = useCallback(() => {
    stopAllRef.current?.();
  }, []);

  // ── Web Speech ─────────────────────────────────────────────────────────
  // Stored in a ref — NEVER in useCallback (avoids dep chain re-creation)
  const startWebSpeechRef = useRef(null);
  startWebSpeechRef.current = () => {
    if (destroyedRef.current) return;
    if (startedRef.current) {
      logSTT('startWebSpeech skipped — already running');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      logSTT('SpeechRecognition not available');
      setStatus('🔴 Browser does not support speech recognition');
      return;
    }

    // Reuse singleton if already created
    if (!recognitionRef.current) {
      logSTT('Creating SpeechRecognition singleton...');
      const rec = new SR();
      rec.continuous      = true;
      rec.interimResults  = true;
      rec.lang            = 'en-US';
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        logSTT('onstart ✓ — recognition running');
        startedRef.current      = true;
        restartCountRef.current = 0;
        setStatus('🎤 Listening...');
      };

      rec.onaudiostart  = () => logSTT('onaudiostart ✓ — mic receiving audio');
      rec.onsoundstart  = () => logSTT('onsoundstart ✓ — non-silent audio detected');
      rec.onspeechstart = () => {
        logSTT('onspeechstart ✓ — speech detected');
        setStatus('🗣 Speech Detected');
      };
      rec.onspeechend = () => {
        logSTT('onspeechend — processing...');
        setStatus('⏳ Processing...');
      };
      rec.onsoundend  = () => logSTT('onsoundend');
      rec.onaudioend  = () => logSTT('onaudioend');
      rec.onnomatch   = () => logSTT('onnomatch — no speech recognized');

      rec.onresult = (event) => {
        logSTT('onresult fired', { resultIndex: event.resultIndex, total: event.results.length });
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text  = event.results[i][0].transcript;
          const conf  = event.results[i][0].confidence;
          const final = event.results[i].isFinal;
          logSTT(`  result[${i}]`, { text, confidence: conf?.toFixed(2), final });
          if (final) {
            finalText += text;
          } else {
            interimText += text;
          }
        }

        if (finalText.trim()) {
          logSTT('FINAL transcript:', finalText.trim());
          onFinalRef.current?.(finalText.trim());
          onSpeechActivityRef.current?.(true);
          setStatus('📝 Transcript received');
          setTimeout(() => {
            if (!destroyedRef.current) setStatus('🎤 Listening...');
          }, 1500);
        } else if (interimText.trim()) {
          logSTT('INTERIM:', interimText);
          onPartialRef.current?.(interimText);
          onSpeechActivityRef.current?.(false);
          setStatus('🗣 Speech Detected');
        }
      };

      rec.onerror = (event) => {
        logSTT('onerror:', event.error);
        startedRef.current = false;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setStatus('🔴 Mic permission denied');
          destroyedRef.current = true;
        } else if (event.error === 'aborted') {
          logSTT('Aborted (likely cleanup)');
        } else if (event.error === 'audio-capture') {
          logSTT('audio-capture error — mic hardware not available, will retry');
          setStatus('⚠️ Mic unavailable, retrying...');
        } else {
          setStatus(`⚠️ STT Error: ${event.error}`);
        }
      };

      rec.onend = () => {
        logSTT('onend — recognition stopped');
        startedRef.current = false;
        if (destroyedRef.current) return;

        const MAX_RESTARTS = 10;
        if (restartCountRef.current >= MAX_RESTARTS) {
          logSTT('Max restart attempts reached, giving up');
          setStatus('⚠️ STT stopped after max retries');
          return;
        }

        const delay = Math.min(500 * Math.pow(1.5, restartCountRef.current), 8000);
        restartCountRef.current++;
        logSTT(`Auto-restarting in ${delay}ms (attempt ${restartCountRef.current}/${MAX_RESTARTS})...`);
        setStatus(`♻️ Reconnecting (${restartCountRef.current}/${MAX_RESTARTS})...`);

        restartTimerRef.current = setTimeout(() => {
          if (!destroyedRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              logSTT('Auto-restart start() called');
            } catch (err) {
              logSTT('Auto-restart start() failed:', err.message);
            }
          }
        }, delay);
      };

      recognitionRef.current = rec;
      engineRef.current      = 'webspeech';
      logSTT('SpeechRecognition singleton created ✓');
    }

    try {
      logSTT('Calling recognition.start()...');
      recognitionRef.current.start();
      logSTT('recognition.start() called ✓');
    } catch (err) {
      logSTT('recognition.start() threw:', err.message);
      if (!err.message.includes('already started')) {
        setStatus(`⚠️ STT start failed: ${err.message}`);
      }
    }
  };

  // ── Deepgram ───────────────────────────────────────────────────────────
  // Also ref-based — no useCallback dep chain
  const startDeepgramRef = useRef(null);
  startDeepgramRef.current = async (stream) => {
    if (destroyedRef.current) return false;

    try {
      logSTT('Fetching Deepgram token...');
      const res    = await api.get('/interviews/token/deepgram');
      const dgData = res?.data;

      if (!dgData?.key || dgData.key === 'MOCK_DEEPGRAM_TOKEN' || dgData.key.length < 20) {
        logSTT('Invalid or mock Deepgram token — skipping', { key: dgData?.key?.substring(0, 8) });
        return false;
      }

      if (destroyedRef.current) return false;

      logSTT('Deepgram token received ✓');
      const mime = getSupportedMimeType();
      logSTT('MediaRecorder mimeType selected:', mime || 'browser default');

      const wsUrl = `${dgData.url}?punctuate=true&interim_results=true&model=nova-2&language=en-US&endpointing=300`;
      logSTT('Connecting to Deepgram WS:', wsUrl.split('?')[0]);

      const ws = new WebSocket(wsUrl, ['token', dgData.key]);

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === 'Results') {
            const text = data.channel?.alternatives?.[0]?.transcript;
            logSTT('RAW Deepgram message', { type: data.type, is_final: data.is_final, text });
            if (!text?.trim()) return;

            if (data.is_final) {
              logSTT('FINAL Deepgram transcript:', text);
              onFinalRef.current?.(text.trim());
              onSpeechActivityRef.current?.(true);
              setStatus('📝 Transcript received');
              setTimeout(() => {
                if (!destroyedRef.current) setStatus('🟢 Deepgram listening...');
              }, 1500);
            } else {
              onPartialRef.current?.(text);
              onSpeechActivityRef.current?.(false);
              setStatus('🗣 Speech Detected');
            }
          } else if (data.type === 'Metadata') {
            logSTT('Deepgram metadata:', data);
          } else if (data.error) {
            logSTT('Deepgram ERROR message:', data.error);
          }
        } catch (err) {
          logSTT('WS message parse error:', err.message);
        }
      };

      ws.onerror = () => {
        logSTT('Deepgram WS onerror');
      };

      ws.onclose = (e) => {
        logSTT('Deepgram WS closed', { code: e.code, reason: e.reason });
        startedRef.current = false;
        deepgramWsRef.current = null;
        if (!destroyedRef.current) {
          setStatus('⚠️ Deepgram disconnected — falling back to browser STT');
          // FIX: call via ref, not captured closure
          setTimeout(() => {
            if (!destroyedRef.current) startWebSpeechRef.current?.();
          }, 500);
        }
      };

      const connected = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          logSTT('Deepgram WS open timeout (8s)');
          resolve(false);
        }, 8000);

        ws.onopen = () => {
          clearTimeout(timeout);
          logSTT('Deepgram WS OPEN ✓');

          try {
            const mr = mime
              ? new MediaRecorder(stream, { mimeType: mime })
              : new MediaRecorder(stream);

            mr.ondataavailable = (e) => {
              if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                ws.send(e.data);
                logSTT('Audio chunk sent', { bytes: e.data.size });
              }
            };

            mr.onerror = (err) => logSTT('MediaRecorder error:', err.message);
            mr.start(250);
            mediaRecorderRef.current = mr;
            logSTT('MediaRecorder started ✓', { mimeType: mr.mimeType, state: mr.state });
            resolve(true);
          } catch (err) {
            logSTT('MediaRecorder init failed:', err.message);
            resolve(false);
          }
        };

        // Override onerror temporarily to resolve false
        const prevOnError = ws.onerror;
        ws.onerror = (e) => {
          clearTimeout(timeout);
          logSTT('Deepgram WS connection error');
          prevOnError?.(e);
          resolve(false);
        };
      });

      if (!connected) {
        logSTT('Deepgram connection failed — will fallback to Web Speech');
        try { ws.close(); } catch {}
        return false;
      }

      deepgramWsRef.current = ws;
      engineRef.current     = 'deepgram';
      startedRef.current    = true;
      setStatus('🟢 Deepgram listening...');
      return true;

    } catch (err) {
      logSTT('startDeepgram threw:', err.message);
      return false;
    }
  };

  // ── Entry point (also ref-based) ───────────────────────────────────────
  const startRef = useRef(null);
  startRef.current = async (stream) => {
    destroyedRef.current    = false;
    restartCountRef.current = 0;
    activeStreamRef.current = stream;
    logSTT('=== STT start() ===');

    const audioTracks = stream?.getAudioTracks() || [];
    logSTT(`Audio tracks: ${audioTracks.length}`,
      audioTracks.map(t => ({ label: t.label, readyState: t.readyState })));

    // Start energy monitor (read-only — never stops tracks)
    if (audioTracks.length > 0) {
      monitorMicEnergyRef.current?.(stream);
    }

    // Try Deepgram first (stream tracks intact)
    if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
      const dgOk = await startDeepgramRef.current(stream);
      if (dgOk) {
        logSTT('Using Deepgram engine ✓');
        return;
      }
      logSTT('Deepgram failed — falling back to Web Speech');
    } else {
      logSTT('No live audio tracks — falling back to Web Speech directly');
    }

    // FIX: Do NOT stop audio tracks here. Web Speech API manages mic independently.
    // Stopping the stream here would permanently kill the getUserMedia-acquired stream
    // and Web Speech would also fail with audio-capture errors on some browsers.
    // Web Speech uses its own internal mic acquisition — no stream needed.
    startWebSpeechRef.current?.();
  };

  // ── Lifecycle ──────────────────────────────────────────────────────────
  // Only depends on [enabled, audioStream] — no function deps that could change
  useEffect(() => {
    logSTT(`Lifecycle: enabled=${enabled}, hasStream=${!!audioStream}`);

    if (!enabled) return;

    // ── No stream path: fall directly to Web Speech ────────────────────
    // This handles the case where getUserMedia was denied or unavailable.
    // Web Speech manages its own mic internally — no stream needed.
    if (!audioStream) {
      if (!startedRef.current) {
        logSTT('No audio stream — attempting Web Speech directly (no energy monitor)');
        destroyedRef.current    = false;
        restartCountRef.current = 0;
        startWebSpeechRef.current?.();
      }
      return () => {
        logSTT('useSTT cleanup (no-stream path) — calling stopAll');
        stopAllRef.current?.();
      };
    }

    // ── Stream available path ──────────────────────────────────────────
    // Skip if exact same stream is already active and running
    if (activeStreamRef.current === audioStream && startedRef.current) {
      logSTT('Same stream already active — skipping duplicate start');
      return;
    }

    // New stream while already running — stop current engine, restart
    if (startedRef.current) {
      logSTT('New stream detected — stopping current engine before restart');
      stopAllRef.current?.();
      setTimeout(() => {
        if (!destroyedRef.current || activeStreamRef.current !== audioStream) {
          destroyedRef.current = false;
          logSTT('Starting STT engine with new stream...');
          startRef.current?.(audioStream);
        }
      }, 200);
      return;
    }

    logSTT('Starting STT engine with stream...');
    startRef.current?.(audioStream);

    return () => {
      logSTT('useSTT cleanup — calling stopAll');
      stopAllRef.current?.();
    };
  }, [enabled, audioStream]); // ← intentionally minimal: no function deps

  return { stopAll, engine: engineRef };
}
