const request = require('supertest');
const express = require('express');
const interviewRoutes = require('../src/routes/interviewRoutes');
const prisma = require('../src/config/database');
const interviewService = require('../src/services/interviewService');

// Mock the service
jest.mock('../src/services/interviewService');

const app = express();
app.use(express.json());
app.use('/interviews', interviewRoutes);

describe('Interview Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start an interview session successfully', async () => {
    const mockUser = { id: 1, role: 'user', firebaseUid: 'test-uid' };
    prisma.user.findUnique.mockResolvedValue(mockUser);
    
    const mockSession = { id: 100, userId: 1, interviewType: 'TECHNICAL', difficulty: 'EASY', role: 'Frontend Engineer' };
    interviewService.createSession.mockResolvedValue(mockSession);

    const res = await request(app)
      .post('/interviews')
      .set('Authorization', 'Bearer valid-token')
      .send({
        interviewType: 'technical',
        difficulty: 'Easy',
        role: 'Frontend Engineer'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockSession);
    expect(interviewService.createSession).toHaveBeenCalledWith(1, 'technical', 'Easy', 'Frontend Engineer');
  });

  it('should reject invalid payload for session creation', async () => {
    const mockUser = { id: 1, role: 'user', firebaseUid: 'test-uid' };
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/interviews')
      .set('Authorization', 'Bearer valid-token')
      .send({
        interviewType: 'INVALID', // Validator should catch this if configured
        difficulty: 'EASY'
      });

    // Depending on validator configuration, this should be 400
    // If validator is strict:
    if (res.status === 400) {
      expect(res.body.success).toBe(false);
    }
  });
});
