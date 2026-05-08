# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Emotion Detection Service
# Uses DeepFace for facial emotion recognition
# ═══════════════════════════════════════════════════════════════

import numpy as np


def detect_emotion(image: np.ndarray) -> dict:
    """
    Detect emotions from a face image using DeepFace.
    Returns dominant emotion and interview-relevant state.
    """
    try:
        from deepface import DeepFace

        analysis = DeepFace.analyze(
            img_path=image,
            actions=["emotion"],
            enforce_detection=False,
            silent=True,
        )

        if isinstance(analysis, list):
            analysis = analysis[0]

        emotions = analysis.get("emotion", {})
        dominant = analysis.get("dominant_emotion", "neutral")

        # Map to interview states
        positive_emotions = ["happy", "surprise"]
        negative_emotions = ["angry", "disgust", "fear", "sad"]

        if dominant in positive_emotions:
            interview_state = "confident"
        elif dominant in negative_emotions:
            interview_state = "stressed"
        else:
            interview_state = "neutral"

        return {
            "dominant_emotion": dominant,
            "emotions": emotions,
            "interview_state": interview_state,
        }

    except Exception as e:
        return {
            "dominant_emotion": "neutral",
            "emotions": {"neutral": 100.0},
            "interview_state": "neutral",
        }
