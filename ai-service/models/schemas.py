# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — Pydantic Schemas for AI Service
# ═══════════════════════════════════════════════════════════════

from pydantic import BaseModel, Field
from typing import Optional, List


# ─── Face Analysis ──────────────────────────────────────────────
class FaceAnalysisRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image frame")

class FaceAnalysisResponse(BaseModel):
    face_detected: bool
    face_direction: Optional[str] = None
    eye_contact: Optional[bool] = None
    eye_contact_score: Optional[float] = None
    posture_score: Optional[float] = None
    head_tilt: Optional[float] = None
    movement_detected: Optional[bool] = None


# ─── Emotion Detection ─────────────────────────────────────────
class EmotionRequest(BaseModel):
    image_base64: str

class EmotionResponse(BaseModel):
    dominant_emotion: str
    emotions: dict
    interview_state: str  # confident, stressed, neutral


# ─── Voice Analysis ────────────────────────────────────────────
class VoiceAnalysisRequest(BaseModel):
    audio_base64: str = Field(..., description="Base64 encoded audio data")
    sample_rate: int = Field(default=16000)

class VoiceAnalysisResponse(BaseModel):
    transcript: str
    word_count: int
    duration_seconds: float
    speech_speed_wpm: float
    pause_count: int
    long_pauses: int
    total_pause_duration: float
    filler_word_count: int
    filler_distribution: dict
    clarity_score: float
    feedback: List[str]


# ─── Confidence Scoring ────────────────────────────────────────
class ConfidenceScoreRequest(BaseModel):
    eye_contact_score: float = Field(default=0, ge=0, le=100)
    posture_score: float = Field(default=0, ge=0, le=100)
    speech_clarity: float = Field(default=0, ge=0, le=100)
    pause_frequency: float = Field(default=0, ge=0, le=100)
    emotion_state: str = Field(default="neutral")
    filler_word_ratio: float = Field(default=0, ge=0, le=1)

class ConfidenceScoreResponse(BaseModel):
    confidence_score: float
    breakdown: dict
    level: str  # low, medium, high


# ─── Report Generation ─────────────────────────────────────────
class ReportRequest(BaseModel):
    interview_type: str
    difficulty: str
    score: Optional[float] = None
    confidence_score: Optional[float] = None
    communication_score: Optional[float] = None
    technical_score: Optional[float] = None
    transcript: Optional[str] = None
    analytics: Optional[dict] = None

class ReportResponse(BaseModel):
    strengths: str
    weaknesses: str
    recommendations: str
    summary: str


# ─── Recommendation Engine ─────────────────────────────────────
class RecommendationRequest(BaseModel):
    user_id: int
    submissions_count: int = 0
    interviews_count: int = 0
    accuracy: float = 0
    weak_topics: List[str] = []
    skill_level: str = "beginner"

class RecommendationResponse(BaseModel):
    recommendations: List[dict]


# ─── Full Interview Analysis ───────────────────────────────────
class FullAnalysisRequest(BaseModel):
    interview_type: str
    difficulty: str
    face_data: Optional[dict] = None
    voice_data: Optional[dict] = None
    emotion_data: Optional[dict] = None

class FullAnalysisResponse(BaseModel):
    confidence_score: float
    confidence_level: str
    eye_contact_score: float
    posture_score: float
    speech_clarity: float
    nervousness_score: float
    speaking_speed: float
    filler_count: int
    dominant_emotion: str
    breakdown: dict
    overall_assessment: str
