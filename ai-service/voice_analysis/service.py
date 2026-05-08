# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Voice Analysis Service (v2)
# Production-grade Whisper transcription + intelligent speech metrics
# ═══════════════════════════════════════════════════════════════

import re
import numpy as np
import logging
from typing import List, Dict, Any
from utils.helpers import clamp
from utils.config import WHISPER_MODEL

logger = logging.getLogger(__name__)

# Comprehensive filler words list
FILLER_WORDS = [
    "um", "uh", "like", "you know", "basically", "actually",
    "so", "right", "i mean", "kind of", "sort of", "literally",
    "honestly", "well", "okay so", "anyway", "guess"
]


def analyze_voice(audio_array: np.ndarray, sample_rate: int = 16000) -> Dict[str, Any]:
    """
    Analyze voice from audio data.
    Returns transcript, speech speed (WPM), pauses, filler words, and clarity score.
    """
    transcript = ""
    segments = []
    
    try:
        import whisper
        # Load model with caching logic if possible (handled by whisper lib)
        model = whisper.load_model(WHISPER_MODEL)

        # Pre-process audio: ensure float32 and normalized
        audio_float = audio_array.astype(np.float32)
        if audio_float.max() > 1.0:
            audio_float = audio_float / 32768.0

        # Transcribe
        result = model.transcribe(audio_float, fp16=False)
        transcript = result.get("text", "").strip()
        segments = result.get("segments", [])

    except ImportError:
        logger.error("Whisper library not found. Voice analysis falling back.")
    except Exception as e:
        logger.error(f"Whisper transcription failed: {str(e)}")

    # ── Speech Metrics Calculation ─────────────────────────────
    words = transcript.split()
    word_count = len(words)
    duration_seconds = len(audio_array) / sample_rate
    duration_minutes = duration_seconds / 60.0
    
    # Words Per Minute (WPM)
    wpm = word_count / max(duration_minutes, 0.01)
    
    # ── Pause Detection ─────────────────────────────────────────
    pause_count = 0
    total_pause_duration = 0.0
    long_pauses = 0
    
    for i in range(1, len(segments)):
        gap = segments[i]["start"] - segments[i - 1]["end"]
        if gap > 0.4:  # Threshold for noticeable pause
            pause_count += 1
            total_pause_duration += gap
            if gap > 1.5:  # Threshold for "long" pause (sign of hesitation)
                long_pauses += 1

    # ── Filler Word Detection ───────────────────────────────────
    transcript_lower = transcript.lower()
    filler_detected = {}
    total_filler_count = 0
    
    for filler in FILLER_WORDS:
        # Use regex to find whole words only
        matches = re.findall(r'\b' + re.escape(filler) + r'\b', transcript_lower)
        count = len(matches)
        if count > 0:
            filler_detected[filler] = count
            total_filler_count += count

    # ── Clarity & Communication Scoring ──────────────────────────
    # 1. Optimal WPM for professional communication is 120-160
    wpm_score = 100 - min(abs(wpm - 140) / 1.5, 60)
    
    # 2. Filler word penalty (aim for < 2% filler words)
    filler_ratio = total_filler_count / max(word_count, 1)
    filler_penalty = min(filler_ratio * 400, 40)
    
    # 3. Pause penalty
    pause_penalty = min(pause_count * 2 + long_pauses * 5, 20)
    
    clarity_score = clamp(wpm_score - filler_penalty - pause_penalty)

    # ── Feedback Generation ─────────────────────────────────────
    feedback = []
    if wpm > 180: feedback.append("Speaking pace is too fast. Try to slow down.")
    elif wpm < 100 and word_count > 10: feedback.append("Speaking pace is a bit slow. Aim for more fluency.")
    
    if filler_ratio > 0.05: feedback.append("High use of filler words detected. Practice minimizing them.")
    if long_pauses > 3: feedback.append("Frequent long pauses detected. Try to maintain a steadier flow.")

    return {
        "transcript": transcript,
        "word_count": word_count,
        "duration_seconds": round(duration_seconds, 2),
        "speech_speed_wpm": round(wpm, 1),
        "pause_count": pause_count,
        "long_pauses": long_pauses,
        "total_pause_duration": round(total_pause_duration, 2),
        "filler_word_count": total_filler_count,
        "filler_distribution": filler_detected,
        "clarity_score": round(clarity_score, 1),
        "feedback": feedback
    }
