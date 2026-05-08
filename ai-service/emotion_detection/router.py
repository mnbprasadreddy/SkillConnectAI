# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Emotion Detection Router
# ═══════════════════════════════════════════════════════════════

from fastapi import APIRouter, HTTPException
from models.schemas import EmotionRequest, EmotionResponse
from emotion_detection.service import detect_emotion
from utils.helpers import decode_base64_image

router = APIRouter()


@router.post("/detect", response_model=EmotionResponse)
async def detect_emotion_endpoint(request: EmotionRequest):
    """Detect emotions from a base64-encoded face image."""
    try:
        image = decode_base64_image(request.image_base64)
        result = detect_emotion(image)
        return EmotionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion detection failed: {str(e)}")
