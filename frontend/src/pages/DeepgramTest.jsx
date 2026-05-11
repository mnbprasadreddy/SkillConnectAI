import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';

const logDG = (msg, data = '') => {
  console.log(`[Deepgram ${Date.now()}] ${msg}`, data);
};

function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

const DeepgramTest = () => {
  const [status, setStatus] = useState('Idle');
  const [transcripts, setTranscripts] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [chunksSent, setChunksSent] = useState(0);

  const rmsRef = useRef(0);
  const rmsUIRef = useRef(null);

  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const micIntervalRef = useRef(null);

  const stopEverything = useCallback(() => {
    setIsRecording(false);
    clearInterval(micIntervalRef.current);
    try { audioCtxRef.current?.close(); } catch {}
    try { mediaRecorderRef.current?.stop(); } catch {}
    try { wsRef.current?.close(); } catch {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setStatus('Stopped');
    logDG('Everything stopped');
  }, []);

  const monitorMicEnergy = (stream) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioCtxRef.current = audioCtx;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      micIntervalRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] / 128.0) - 1.0;
          sumSquares += norm * norm;
        }
        const newRms = Math.sqrt(sumSquares / dataArray.length);
        rmsRef.current = newRms;
        
        // Update DOM directly instead of using React state
        if (rmsUIRef.current) {
          rmsUIRef.current.style.width = `${Math.min(100, newRms * 500)}%`;
        }
      }, 100);
    } catch (err) {
      logDG('Failed to start AudioContext:', err);
    }
  };

  const startDeepgram = async () => {
    try {
      setStatus('Fetching token...');
      const dgRes = await api.get('/interviews/token/deepgram');
      const dgData = dgRes?.data;

      if (!dgData?.key || dgData.key === 'MOCK_DEEPGRAM_TOKEN') {
        setStatus('Error: MOCK_DEEPGRAM_TOKEN returned from backend. Missing real key.');
        return;
      }
      logDG('Token received');

      setStatus('Requesting Microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      monitorMicEnergy(stream);

      setStatus('Connecting WS...');
      const wsUrl = `${dgData.url}?punctuate=true&interim_results=true&model=nova-2&language=en-US&endpointing=300`;
      const ws = new WebSocket(wsUrl, ['token', dgData.key]);
      wsRef.current = ws;

      ws.onopen = () => {
        logDG('WS OPEN ✓');
        setStatus('Connected, Recording...');
        setIsRecording(true);
        setChunksSent(0);

        const mime = getSupportedMimeType();
        logDG('MediaRecorder MIME:', mime || 'default');
        
        const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        mediaRecorderRef.current = mr;

        mr.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data);
            setChunksSent(prev => {
              const next = prev + 1;
              if (next % 10 === 0) logDG('Audio chunk sent', { size: e.data.size, count: next });
              return next;
            });
          }
        };
        mr.start(250);
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          // logDG('RAW MESSAGE', JSON.stringify(data, null, 2));

          const text = data.channel?.alternatives?.[0]?.transcript;
          if (text && text.trim()) {
            if (data.is_final) {
              logDG('Transcript received (FINAL):', text);
              setTranscripts(prev => [...prev, text]);
            }
          }
        } catch (err) {
          logDG('WS Message Parse Error', err);
        }
      };

      ws.onerror = (e) => {
        logDG('WS Error');
        setStatus('WS Error');
      };

      ws.onclose = () => {
        logDG('WS Closed');
        if (isRecording) stopEverything();
      };

    } catch (err) {
      logDG('Start Error', err.message);
      setStatus(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    return () => stopEverything();
  }, [stopEverything]);

  return (
    <div className="min-h-screen bg-slate-900 text-cyan-400 p-8 font-mono">
      <h1 className="text-2xl font-bold mb-6 border-b border-cyan-800 pb-2">ISOLATED DEEPGRAM STT TEST</h1>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={startDeepgram}
          disabled={isRecording}
          className="bg-cyan-600 hover:bg-cyan-500 text-slate-900 px-6 py-2 rounded font-bold disabled:opacity-50"
        >
          Start Recording
        </button>
        <button 
          onClick={stopEverything}
          disabled={!isRecording}
          className="bg-red-600 hover:bg-red-500 text-slate-900 px-6 py-2 rounded font-bold disabled:opacity-50"
        >
          Stop Recording
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 border border-cyan-800 p-4 rounded bg-black/50">
        <div>
          <div className="font-bold mb-2 opacity-50 uppercase text-xs">Status</div>
          <div className="text-lg">{status}</div>
        </div>
        <div>
          <div className="font-bold mb-2 opacity-50 uppercase text-xs">Audio Chunks Sent</div>
          <div className="text-lg">{chunksSent}</div>
        </div>
        <div>
          <div className="font-bold mb-2 opacity-50 uppercase text-xs">Mic RMS Volume</div>
          <div className="text-lg flex items-center gap-2">
            <div className="w-32 h-2 bg-slate-800 rounded overflow-hidden">
              <div 
                ref={rmsUIRef}
                className="h-full bg-cyan-400 transition-all duration-75"
                style={{ width: '0%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border border-cyan-800 p-4 rounded bg-black/50 min-h-[300px]">
        <div className="font-bold mb-4 opacity-50 uppercase text-xs">Final Transcripts</div>
        {transcripts.length === 0 ? (
          <div className="text-slate-600 italic">No final transcripts yet. Speak into the microphone.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {transcripts.map((t, i) => (
              <div key={i} className="p-2 bg-slate-800/50 rounded border border-slate-700">
                <span className="opacity-50 mr-2">[{i}]</span> {t}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepgramTest;
