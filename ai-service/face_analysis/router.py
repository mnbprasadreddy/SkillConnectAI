# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Face Analysis Router
# ═══════════════════════════════════════════════════════════════

from fastapi import APIRouter, HTTPException
from models.schemas import FaceAnalysisRequest, FaceAnalysisResponse
from face_analysis.service import analyze_face
from utils.helpers import decode_base64_image

router = APIRouter()


@router.post("/analyze", response_model=FaceAnalysisResponse)
async def analyze_face_endpoint(request: FaceAnalysisRequest):
    """Analyze face from a base64-encoded image frame."""
    try:
        image = decode_base64_image(request.image_base64)
        result = analyze_face(image)
        return FaceAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face analysis failed: {str(e)}")
