# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Recommendation Engine Router
# ═══════════════════════════════════════════════════════════════

from fastapi import APIRouter, HTTPException
from models.schemas import RecommendationRequest, RecommendationResponse
from recommendation_engine.service import generate_recommendations

router = APIRouter()


@router.post("/generate", response_model=RecommendationResponse)
async def generate_recommendations_endpoint(request: RecommendationRequest):
    """Generate personalized recommendations based on user performance."""
    try:
        recs = generate_recommendations(
            user_id=request.user_id,
            submissions_count=request.submissions_count,
            interviews_count=request.interviews_count,
            accuracy=request.accuracy,
            weak_topics=request.weak_topics,
            skill_level=request.skill_level,
        )
        return RecommendationResponse(recommendations=recs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")
