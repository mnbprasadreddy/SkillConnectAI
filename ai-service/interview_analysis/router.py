# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Interview Analysis Router
# ═══════════════════════════════════════════════════════════════

from fastapi import APIRouter, HTTPException
from models.schemas import (
    ConfidenceScoreRequest, ConfidenceScoreResponse,
    FullAnalysisRequest, FullAnalysisResponse,
)
from interview_analysis.service import calculate_confidence_score, full_interview_analysis

router = APIRouter()


@router.post("/confidence-score", response_model=ConfidenceScoreResponse)
async def confidence_score_endpoint(request: ConfidenceScoreRequest):
    """Calculate confidence score from individual metrics."""
    try:
        result = calculate_confidence_score(
            eye_contact_score=request.eye_contact_score,
            posture_score=request.posture_score,
            speech_clarity=request.speech_clarity,
            pause_frequency=request.pause_frequency,
            emotion_state=request.emotion_state,
            filler_word_ratio=request.filler_word_ratio,
        )
        return ConfidenceScoreResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Confidence scoring failed: {str(e)}")


@router.post("/full-analysis", response_model=FullAnalysisResponse)
async def full_analysis_endpoint(request: FullAnalysisRequest):
    """Perform complete interview analysis combining all signals."""
    try:
        result = full_interview_analysis(
            face_data=request.face_data,
            voice_data=request.voice_data,
            emotion_data=request.emotion_data,
        )
        return FullAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Full analysis failed: {str(e)}")


@router.post("/questions")
async def generate_questions(request: dict):
    """Generate interview questions (placeholder — uses main backend's fallback)."""
    interview_type = request.get("interview_type", "behavioral")
    difficulty = request.get("difficulty", "Easy")
    count = request.get("count", 5)

    # This would typically use Gemini API for dynamic question generation
    return {
        "interview_type": interview_type,
        "difficulty": difficulty,
        "questions": [f"Sample {interview_type} question {i+1}" for i in range(count)],
    }
