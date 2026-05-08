# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Interview Analysis Service (v2)
# Advanced weighted confidence scoring + holistic assessment
# ═══════════════════════════════════════════════════════════════

from typing import Dict, Any
from utils.helpers import clamp

# ── Weighted Scoring Configuration ──────────────────────────────
# Weights are balanced for professional interview contexts
WEIGHTS = {
    "eye_contact": 0.25,      # Critical for engagement
    "posture": 0.15,          # Indicates professional presence
    "speech_clarity": 0.25,   # Core communication metric
    "fluency": 0.15,          # Pauses and flow
    "emotion": 0.10,          # Emotional state stability
    "filler_words": 0.10,     # Professionalism signal
}

EMOTION_SCORE_MAP = {
    "confident": 100,
    "happy": 85,
    "neutral": 65,
    "surprise": 55,
    "stressed": 35,
    "sad": 25,
    "angry": 20,
    "fear": 15,
    "disgust": 10,
}


def calculate_confidence_score(
    eye_contact_score: float = 65,
    posture_score: float = 65,
    speech_clarity: float = 65,
    pause_metrics: dict = None,
    pause_frequency: float = None,  # Legacy support
    emotion_state: str = "neutral",
    filler_word_ratio: float = 0,
) -> Dict[str, Any]:
    """
    Calculate a composite confidence score from multiple AI signals.
    """
    # ── 1. Emotion Score ────────────────────────────────────────
    emotion_score = EMOTION_SCORE_MAP.get(emotion_state.lower(), 60)

    # ── 2. Filler Word Score ────────────────────────────────────
    # Penalty increases sharply after 3% filler words
    filler_score = clamp(100 - (filler_word_ratio * 1500)) 

    # ── 3. Fluency Score (from pauses) ─────────────────────────
    if pause_metrics:
        # Penalize many short pauses and especially long pauses
        pause_count = pause_metrics.get("pause_count", 0)
        long_pauses = pause_metrics.get("long_pauses", 0)
        fluency_base = 100 - (pause_count * 2) - (long_pauses * 8)
        fluency_score = clamp(fluency_base)
    elif pause_frequency is not None:
        fluency_score = clamp(100 - pause_frequency)
    else:
        fluency_score = 65

    # ── 4. Weighted Composite ──────────────────────────────────
    composite = (
        eye_contact_score * WEIGHTS["eye_contact"] +
        posture_score * WEIGHTS["posture"] +
        speech_clarity * WEIGHTS["speech_clarity"] +
        fluency_score * WEIGHTS["fluency"] +
        emotion_score * WEIGHTS["emotion"] +
        filler_score * WEIGHTS["filler_words"]
    )

    confidence = round(clamp(composite), 1)

    # ── 5. Confidence Level ─────────────────────────────────────
    if confidence >= 85: level = "High"
    elif confidence >= 70: level = "Above Average"
    elif confidence >= 50: level = "Moderate"
    elif confidence >= 30: level = "Low"
    else: level = "Critically Low"

    return {
        "confidence_score": confidence,
        "level": level,
        "breakdown": {
            "eye_contact": round(eye_contact_score, 1),
            "posture": round(posture_score, 1),
            "speech_clarity": round(speech_clarity, 1),
            "fluency": round(fluency_score, 1),
            "emotion": round(emotion_score, 1),
            "filler_words": round(filler_score, 1),
        }
    }


def full_interview_analysis(
    face_data: Dict = None,
    voice_data: Dict = None,
    emotion_data: Dict = None,
) -> Dict[str, Any]:
    """
    Combine all analysis signals into a final holistic assessment.
    """
    # Extract metrics with safe defaults
    eye_contact = face_data.get("eye_contact_score", 65) if face_data else 65
    posture = face_data.get("posture_score", 65) if face_data else 65
    
    clarity = voice_data.get("clarity_score", 65) if voice_data else 65
    wpm = voice_data.get("speech_speed_wpm", 0) if voice_data else 0
    
    word_count = voice_data.get("word_count", 0) if voice_data else 0
    filler_count = voice_data.get("filler_word_count", 0) if voice_data else 0
    filler_ratio = filler_count / max(word_count, 1)
    
    pause_metrics = {
        "pause_count": voice_data.get("pause_count", 0) if voice_data else 0,
        "long_pauses": voice_data.get("long_pauses", 0) if voice_data else 0
    }
    
    emotion_state = emotion_data.get("dominant_emotion", "neutral") if emotion_data else "neutral"
    
    # Calculate composite
    conf_analysis = calculate_confidence_score(
        eye_contact_score=eye_contact,
        posture_score=posture,
        speech_clarity=clarity,
        pause_metrics=pause_metrics,
        emotion_state=emotion_state,
        filler_word_ratio=filler_ratio
    )
    
    confidence = conf_analysis["confidence_score"]
    
    # ── Nervousness Scoring ─────────────────────────────────────
    # High nervousness is indicated by high fillers, many pauses, and low eye contact
    nervousness_base = (
        (100 - eye_contact) * 0.3 +
        (filler_ratio * 1000) * 0.3 +
        (pause_metrics["pause_count"] * 5) * 0.4
    )
    if emotion_state in ["stressed", "fear"]: nervousness_base += 20
    
    nervousness_score = round(clamp(nervousness_base), 1)

    # ── Overall Verdict ────────────────────────────────────────
    if confidence >= 85:
        assessment = "Outstanding performance. Candidate demonstrates exceptional confidence and articulate communication."
    elif confidence >= 70:
        assessment = "Strong performance. Good engagement and clear delivery with minor areas for polish."
    elif confidence >= 50:
        assessment = "Solid baseline performance. Needs to work on consistent engagement and reducing hesitation."
    else:
        assessment = "Needs significant practice. Recommend focusing on non-verbal cues and speech fluency."

    return {
        "confidence_score": confidence,
        "confidence_level": conf_analysis["level"],
        "eye_contact_score": round(eye_contact, 1),
        "posture_score": round(posture, 1),
        "speech_clarity": round(clarity, 1),
        "nervousness_score": nervousness_score,
        "speaking_speed": wpm,
        "filler_count": filler_count,
        "dominant_emotion": emotion_state,
        "breakdown": conf_analysis["components"],
        "overall_assessment": assessment
    }
