# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Report Generator Router
# ═══════════════════════════════════════════════════════════════

from fastapi import APIRouter, HTTPException
from models.schemas import ReportRequest, ReportResponse
from report_generator.service import generate_report

router = APIRouter()


@router.post("/generate", response_model=ReportResponse)
async def generate_report_endpoint(request: ReportRequest):
    """Generate an AI-powered interview performance report."""
    try:
        result = generate_report(
            interview_type=request.interview_type,
            difficulty=request.difficulty,
            score=request.score,
            confidence_score=request.confidence_score,
            communication_score=request.communication_score,
            technical_score=request.technical_score,
            transcript=request.transcript,
            analytics=request.analytics,
        )
        return ReportResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")
