// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Express Application
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Route imports
const userRoutes = require('./routes/userRoutes');
const problemRoutes = require('./routes/problemRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const contestRoutes = require('./routes/contestRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const materialRoutes = require('./routes/materialRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiCoachRoutes = require('./routes/aiCoachRoutes');

// Middleware imports
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ─── Global Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    console.log(`[CORS] Incoming origin: ${origin}`);
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://skill-connect-ai-gamma.vercel.app', // Production Vercel URL
    ];
    
    // Keep environment variables supported for future deployments
    if (process.env.CLIENT_URL) {
      process.env.CLIENT_URL.split(',').forEach(url => {
        if (url.trim()) allowedOrigins.push(url.trim());
      });
    }

    if (!origin || allowedOrigins.includes(origin)) {
      console.log(`[CORS] Allowed origin: ${origin || 'NO_ORIGIN'}`);
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(apiLimiter);

// ─── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillConnect AI Backend API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', async (req, res) => {
  const prisma = require('./config/database');
  const checks = { database: 'unknown', uptime: process.uptime() };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
  }

  res.status(200).json({
    success: true,
    service: 'main-backend',
    status: checks.database === 'connected' ? 'healthy' : 'degraded',
    checks,
  });
});

// Dev-only: Full connectivity check
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/health/full', async (req, res) => {
    const prisma = require('./config/database');
    const axios = require('axios');
    const judge0Config = require('./config/judge0');
    const results = {};

    // Check PostgreSQL
    try {
      await prisma.$queryRaw`SELECT 1`;
      results.database = { status: 'connected', provider: 'Neon PostgreSQL' };
    } catch (e) {
      results.database = { status: 'error', message: e.message };
    }

    // Check Judge0
    try {
      const resp = await axios.get(`${judge0Config.baseUrl}/statuses`, {
        headers: judge0Config.getHeaders(),
        timeout: 5000,
      });
      results.judge0 = { status: 'connected', statuses: resp.data?.length || 0 };
    } catch (e) {
      results.judge0 = { status: 'error', message: e.response?.data?.message || e.message };
    }

    // Check AI Service
    try {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const resp = await axios.get(`${aiUrl}/api/ai/health`, { timeout: 3000 });
      results.aiService = { status: 'connected', data: resp.data };
    } catch (e) {
      results.aiService = { status: 'unavailable', message: 'AI service not running' };
    }

    // Check Firebase
    try {
      const admin = require('./config/firebase');
      results.firebase = { status: admin.apps.length > 0 ? 'initialized' : 'not_initialized' };
    } catch (e) {
      results.firebase = { status: 'error', message: e.message };
    }

    const allHealthy = Object.values(results).every((r) => r.status === 'connected' || r.status === 'initialized');

    res.status(200).json({
      success: true,
      status: allHealthy ? 'all_systems_go' : 'degraded',
      services: results,
    });
  });
}

// ─── Static Files ──────────────────────────────────────────────
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-coach', aiCoachRoutes);
app.use('/api/replays', require('./routes/replayRoutes'));

// ─── Error Handling ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
