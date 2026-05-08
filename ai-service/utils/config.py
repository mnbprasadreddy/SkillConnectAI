# ═══════════════════════════════════════════════════════════════
# SkillConnect AI — AI Service Configuration
# ═══════════════════════════════════════════════════════════════

import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MAIN_BACKEND_URL = os.getenv("MAIN_BACKEND_URL", "http://localhost:5000")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
PORT = int(os.getenv("PORT", 8000))
