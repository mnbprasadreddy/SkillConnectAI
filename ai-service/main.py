# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — FastAPI Main Application
# AI Backend Service for face, voice, emotion analysis
# ═══════════════════════════════════════════════════════════════

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# Import routers
from face_analysis.router import router as face_router
from emotion_detection.router import router as emotion_router
from voice_analysis.router import router as voice_router
from recommendation_engine.router import router as recommendation_router
from report_generator.router import router as report_router
from interview_analysis.router import router as interview_router

# ─── App Setup ──────────────────────────────────────────────────
app = FastAPI(
    title="SkillConnect AI — AI Service",
    description="AI-powered face analysis, voice analysis, emotion detection, and report generation",
    version="1.0.0",
)

# ─── CORS ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Health Check ───────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "success": True,
        "message": "SkillConnect AI — AI Service is running",
        "version": "1.0.0",
    }

@app.get("/api/ai/health")
async def health_check():
    return {
        "success": True,
        "service": "ai-backend",
        "status": "healthy",
    }

# ─── Register Routers ──────────────────────────────────────────
app.include_router(face_router, prefix="/api/ai/face", tags=["Face Analysis"])
app.include_router(emotion_router, prefix="/api/ai/emotion", tags=["Emotion Detection"])
app.include_router(voice_router, prefix="/api/ai/voice", tags=["Voice Analysis"])
app.include_router(recommendation_router, prefix="/api/ai/recommendations", tags=["Recommendations"])
app.include_router(report_router, prefix="/api/ai/report", tags=["Report Generator"])
app.include_router(interview_router, prefix="/api/ai/interview", tags=["Interview Analysis"])

# ─── Run ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
