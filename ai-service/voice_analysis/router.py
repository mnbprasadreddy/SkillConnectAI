# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Voice Analysis Router
# ═══════════════════════════════════════════════════════════════

from fastapi import APIRouter, HTTPException
from models.schemas import VoiceAnalysisRequest, VoiceAnalysisResponse
from voice_analysis.service import analyze_voice
from utils.helpers import decode_base64_audio

router = APIRouter()


@router.post("/analyze", response_model=VoiceAnalysisResponse)
async def analyze_voice_endpoint(request: VoiceAnalysisRequest):
    """Analyze voice from base64-encoded audio data."""
    try:
        audio = decode_base64_audio(request.audio_base64, request.sample_rate)
        result = analyze_voice(audio, request.sample_rate)
        return VoiceAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice analysis failed: {str(e)}")
