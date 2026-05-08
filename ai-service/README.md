# SkillConnect AI — AI Service

Python FastAPI service for AI-powered face analysis, voice analysis, emotion detection, and report generation.

## Tech Stack

- **Framework**: FastAPI
- **Face Analysis**: MediaPipe, OpenCV
- **Emotion Detection**: DeepFace
- **Voice Analysis**: OpenAI Whisper
- **Report Generation**: Google Gemini API

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Start server
python main.py
# or
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Route | Path | Method |
|-------|------|--------|
| Face Analysis | `/api/ai/face/analyze` | POST |
| Emotion Detection | `/api/ai/emotion/detect` | POST |
| Voice Analysis | `/api/ai/voice/analyze` | POST |
| Confidence Score | `/api/ai/interview/confidence-score` | POST |
| Full Analysis | `/api/ai/interview/full-analysis` | POST |
| Generate Report | `/api/ai/report/generate` | POST |
| Recommendations | `/api/ai/recommendations/generate` | POST |
| Health Check | `/api/ai/health` | GET |

## Docs

Interactive API docs available at `http://localhost:8000/docs` (Swagger UI).
