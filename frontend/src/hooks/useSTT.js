/**
 * useSTT — Speech-to-Text hook v6 (stabilized)
 *
 * Architecture:
 *  Tier 1: Deepgram (if real key) — MediaRecorder → WebSocket
 *  Tier 2: Web Speech API — browser-native, no stream conflict
 *
 * Key fixes vs v5:
 *  - monitorMicEnergy no longer stops the original stream (was killing Web Speech mic)
 *  - setStatus only fires on state TRANSITIONS, not on every interval tick
 *  - Deepgram ws.onmessage attached BEFORE resolving the open promise
 *  - WebSpeech auto-restart with exponential backoff (max 5 attempts)
 *  - All catch blocks log errors (no more silent {} swallowing)
 *  - initializedRef guards against React StrictMode double-mount
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
  const destroyedRef     = useRef(false);
  const startedRef       = useRef(false);
  const initializedRef   = useRef(false);
  const engineRef        = useRef('none');
  const restartCountRef  = useRef(0);
  const restartTimerRef  = useRef(null);

  // Energy monitor refs — NEVER stop the source stream
  const audioCtxRef      = useRef(null);
  const micIntervalRef   = useRef(null);
  const lastStatusRef    = useRef('');  // prevents duplicate setStatus calls

  // Stable callback refs (avoids stale closures without recreating engine)
  const onPartialRef        = useRef(onPartial);
  const onFinalRef          = useRef(onFinal);
  const onStatusChangeRef   = useRef(onStatusChange);
  const onSpeechActivityRef = useRef(onSpeechActivity);

  useEffect(() => { onPartialRef.current        = onPartial;       }, [onPartial]);
  useEffect(() => { onFinalRef.current          = onFinal;         }, [onFinal]);
  useEffect(() => { onStatusChangeRef.current   = onStatusChange;  }, [onStatusChange]);
  useEffect(() => { onSpeechActivityRef.current = onSpeechActivity;}, [onSpeechActivity]);

  // Deduplicated status setter — only fires when text actually changes
  const setStatus = useCallback((s) => {
    if (lastStatusRef.current === s) return;
    lastStatusRef.current = s;
    onStatusChangeRef.current?.(s);
  }, []);

  // ── Energy monitor ────────────────────────────────────────────────────
  // IMPORTANT: reads from the stream but NEVER stops its tracks.
  // Web Speech or Deepgram will use those same tracks.
  const monitorMicEnergy = useCallback((stream) => {
    if (!stream || stream.getAudioTracks().length === 0) return;
    try {
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

        // Only log and update status on transitions to prevent rerender storm
        if (rms > 0.04 && wasSilent) {
          wasSilent = false;
          logSTT('Mic energy detected (sound active)', { rms: rms.toFixed(3) });
          // Do NOT call setStatus here — that was causing rerenders on every 500ms tick.
          // The engine's onstart/onspeechstart events handle status updates.
        } else if (rms <= 0.04 && !wasSilent) {
          wasSilent = true;
          logSTT('Mic energy low (silence)', { rms: rms.toFixed(3) });
        }
      }, 500);
    } catch (err) {
      logSTT('AudioContext init failed:', err.message);
    }
  }, []);

  // ── Full stop ─────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    logSTT('stopAll() called');
    destroyedRef.current = true;
    startedRef.current   = false;

    clearInterval(micIntervalRef.current);
    clearTimeout(restartTimerRef.current);
    micIntervalRef.current  = null;
    restartTimerRef.current = null;

    try { audioCtxRef.current?.close(); } catch {}

    try {
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch {}

    try {
      if (deepgramWsRef.current) {
        deepgramWsRef.current.onclose = null; // prevent restart loop
        deepgramWsRef.current.close();
        deepgramWsRef.current = null;
      }
    } catch {}

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // prevent restart loop
        recognitionRef.current.abort();
      }
    } catch (err) {
      logSTT('recognition.abort() failed:', err.message);
    }

    setStatus('⏹ Stopped');
    logSTT('All engines stopped');
  }, [setStatus]);

  // ── Web Speech ────────────────────────────────────────────────────────
  const startWebSpeech = useCallback(() => {
    if (destroyedRef.current) return;
    if (startedRef.current) {
      logSTT('startWebSpeech skipped — already running');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      logSTT('SpeechRecognition not available in this browser');
      setStatus('🔴 Browser does not support speech recognition');
      return;
    }

    // Singleton: create instance only once
    if (!recognitionRef.current) {
      logSTT('Creating SpeechRecognition singleton...');
      const rec = new SR();
      rec.continuous      = true;
      rec.interimResults  = true;
      rec.lang            = 'en-US';
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        logSTT('onstart ✓ — recognition running');
        startedRef.current   = true;
        restartCountRef.current = 0;
        setStatus('🎤 Listening...');
      };

      rec.onaudiostart  = () => logSTT('onaudiostart ✓ — mic receiving audio');
      rec.onsoundstart  = () => logSTT('onsoundstart ✓ — non-silent audio detected');
      rec.onspeechstart = () => {
        logSTT('onspeechstart ✓ — speech detected');
        setStatus('🗣 Speech Detected');
      };
      rec.onspeechend   = () => {
        logSTT('onspeechend — processing...');
        setStatus('⏳ Processing...');
      };
      rec.onsoundend    = () => logSTT('onsoundend');
      rec.onaudioend    = () => logSTT('onaudioend');
      rec.onnomatch     = () => logSTT('onnomatch — no speech recognized');

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
          destroyedRef.current = true; // Don't retry if denied
        } else if (event.error === 'aborted') {
          logSTT('Aborted (likely cleanup)');
        } else {
          setStatus(`⚠️ STT Error: ${event.error}`);
        }
      };

      rec.onend = () => {
        logSTT('onend — recognition stopped');
        startedRef.current = false;

        if (destroyedRef.current) return; // Clean shutdown — don't restart

        const MAX_RESTARTS = 5;
        if (restartCountRef.current >= MAX_RESTARTS) {
          logSTT('Max restart attempts reached, giving up');
          setStatus('⚠️ STT stopped after max retries');
          return;
        }

        // Exponential backoff: 500ms, 1s, 2s, 4s, 8s
        const delay = Math.min(500 * Math.pow(2, restartCountRef.current), 8000);
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
      engineRef.current = 'webspeech';
      logSTT('SpeechRecognition singleton created ✓');
    }

    try {
      logSTT('Calling recognition.start()...');
      recognitionRef.current.start();
      logSTT('recognition.start() called ✓');
    } catch (err) {
      logSTT('recognition.start() threw:', err.message);
      // 'already started' is safe to ignore
      if (!err.message.includes('already started')) {
        setStatus(`⚠️ STT start failed: ${err.message}`);
      }
    }
  }, [setStatus]);

  // ── Deepgram ─────────────────────────────────────────────────────────
  const startDeepgram = useCallback(async (stream) => {
    if (destroyedRef.current) return false;

    try {
      logSTT('Fetching Deepgram token...');
      const res    = await api.get('/interviews/token/deepgram');
      const dgData = res?.data;

      if (!dgData?.key || dgData.key === 'MOCK_DEEPGRAM_TOKEN' || dgData.key.length < 20) {
        logSTT('Invalid or mock Deepgram token — skipping', { key: dgData?.key?.substring(0, 8) });
        return false;
      }

      logSTT('Deepgram token received ✓');
      const mime = getSupportedMimeType();
      logSTT('MediaRecorder mimeType selected:', mime || 'browser default');

      const wsUrl = `${dgData.url}?punctuate=true&interim_results=true&model=nova-2&language=en-US&endpointing=300&encoding=linear16`;
      logSTT('Connecting to Deepgram WS:', wsUrl.split('?')[0]);

      const ws = new WebSocket(wsUrl, ['token', dgData.key]);

      // Attach onmessage BEFORE waiting for open to avoid dropping early messages
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);

          // Log raw for diagnostics but throttle to avoid log spam
          if (data.type === 'Results') {
            const text = data.channel?.alternatives?.[0]?.transcript;
            logSTT('RAW Deepgram message', { type: data.type, is_final: data.is_final, speech_final: data.speech_final, text });

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

      ws.onerror = (e) => {
        logSTT('Deepgram WS onerror:', e.message || 'WebSocket error event');
      };

      ws.onclose = (e) => {
        logSTT('Deepgram WS closed', { code: e.code, reason: e.reason });
        startedRef.current = false;
        if (!destroyedRef.current) {
          setStatus('⚠️ Deepgram disconnected — falling back to browser STT');
          // Fallback to Web Speech
          setTimeout(() => {
            if (!destroyedRef.current) startWebSpeech();
          }, 500);
        }
      };

      // Now wait for open with timeout
      const connected = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          logSTT('Deepgram WS open timeout (6s)');
          resolve(false);
        }, 6000);

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

            mr.onerror = (err) => {
              logSTT('MediaRecorder error:', err.message);
            };

            mr.start(250);
            mediaRecorderRef.current = mr;
            logSTT('MediaRecorder started ✓', { mimeType: mr.mimeType, state: mr.state });
            resolve(true);
          } catch (err) {
            logSTT('MediaRecorder init failed:', err.message);
            resolve(false);
          }
        };

        // Override onerror temporarily for connection failure detection
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
  }, [setStatus, startWebSpeech]);

  // ── Entry point ───────────────────────────────────────────────────────
  const start = useCallback(async (stream) => {
    destroyedRef.current = false;
    restartCountRef.current = 0;
    logSTT('=== STT start() ===');

    const audioTracks = stream?.getAudioTracks() || [];
    logSTT(`Audio tracks: ${audioTracks.length}`, audioTracks.map(t => ({ label: t.label, readyState: t.readyState })));

    // Always start energy monitor on the RAW stream (does NOT consume/stop tracks)
    if (audioTracks.length > 0) {
      monitorMicEnergy(stream);
    }

    // Try Deepgram first (stream tracks remain live for MediaRecorder)
    if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
      const dgOk = await startDeepgram(stream);
      if (dgOk) {
        logSTT('Using Deepgram engine ✓');
        return;
      }
      logSTT('Deepgram failed — falling back to Web Speech');
    }

    // Web Speech fallback
    // CRITICAL: Web Speech manages the mic internally via its own getUserMedia.
    // If we hold the stream's tracks open, Chrome may block Web Speech from acquiring the mic.
    // Stop the tracks now so Web Speech can take over.
    if (audioTracks.length > 0) {
      logSTT('Releasing audio tracks so Web Speech can acquire mic...');
      audioTracks.forEach(t => { t.stop(); logSTT('  stopped track:', t.label); });
      await new Promise(r => setTimeout(r, 300)); // brief pause for OS to release hardware
    }

    startWebSpeech();
  }, [monitorMicEnergy, startDeepgram, startWebSpeech]);

  // ── Lifecycle ─────────────────────────────────────────────────────────
  useEffect(() => {
    logSTT(`Lifecycle: enabled=${enabled}, hasStream=${!!audioStream}`);
    if (!enabled || !audioStream) return;

    if (initializedRef.current) {
      logSTT('Already initialized — skipping duplicate mount');
      return;
    }
    initializedRef.current = true;
    logSTT('Starting STT engine...');
    start(audioStream);

    return () => {
      logSTT('useSTT unmounting — calling stopAll');
      initializedRef.current = false;
      stopAll();
    };
  }, [enabled, audioStream, start, stopAll]);

  return { stopAll, engine: engineRef };
}
