# SkillConnect AI — Deployment Guide

This document outlines how to deploy SkillConnect AI for production, specifically tailored for free-tier hosting providers like Render and Vercel.

## Architecture Overview
- **Frontend**: React/Vite SPA
- **Backend**: Node.js/Express
- **AI Service**: Python FastAPI (Whisper STT)
- **Database**: Neon Serverless PostgreSQL
- **Storage**: Local Disk (with Render disk persistence) or Firebase Storage

---

## 1. Local Deployment (Docker Compose)
To run the entire stack locally in isolated containers:
1. Copy `.env.example` to `.env` in `frontend`, `backend`, and `ai-service` directories and fill in your keys.
2. Run `docker-compose up --build`.
   - Frontend will be at `http://localhost:5173`
   - Backend will be at `http://localhost:5000`
   - AI Service will be at `http://localhost:8000`

---

## 2. Production Deployment (Render Free Tier)

### Free Tier Limitations & Workarounds
- **Memory Limits**: Render free instances have 512MB of RAM. The AI Service uses the `WHISPER_MODEL=base` (or `tiny`) model to avoid OOM crashes.
- **Disk Persistence**: Render free Web Services use ephemeral storage. Any local replays in `backend/uploads` will be lost on spin-down. For persistent storage, use Firebase Storage (default integration) or upgrade the Render plan to attach a Persistent Disk.
- **Sleep Timeout**: Free services sleep after 15 minutes of inactivity. Startup might take 30-50 seconds.

### Backend Deployment (Node.js)
1. Connect your GitHub repository to Render.
2. Create a new **Web Service**.
3. **Build Command**: `npm install && npx prisma generate`
4. **Start Command**: `npm start`
5. **Environment Variables**: Add all variables from `backend/.env`.

### AI Service Deployment (Python)
1. Create another **Web Service** on Render.
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000` (Render defaults to 10000).
4. **Environment Variables**: Add `ALLOWED_ORIGINS` (your frontend URL) and `WHISPER_MODEL=base`.

### Frontend Deployment (Vercel or Render)
**Vercel (Recommended):**
1. Import the repository to Vercel.
2. Root Directory: `frontend`
3. Add `VITE_API_BASE_URL` and `VITE_AI_BASE_URL` pointing to your Render services.
4. Deploy.

---

## 3. Troubleshooting

- **Webcam/Mic Permissions**: Browsers require HTTPS or `localhost` to grant media permissions. If testing on a local network IP, use ngrok or enable HTTPS.
- **Whisper Memory Crashes**: If the Python service crashes on audio processing, change `WHISPER_MODEL=base` to `WHISPER_MODEL=tiny`.
- **Database Migrations**: Always use `npx prisma db push` on Render to avoid migration conflicts unless you have a robust CD pipeline.
- **Browser Compatibility**: Chrome or Chromium-based browsers are highly recommended for the best Web Speech API fallback and `video/webm` recording support.
