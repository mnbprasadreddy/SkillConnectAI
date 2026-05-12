const request = require('supertest');
const express = require('express');
const adminRoutes = require('../src/routes/adminRoutes');
const prisma = require('../src/config/database');
const admin = require('../src/config/firebase');

// Create a local app for testing
const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);

describe('Admin Routes Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should block a normal user from admin stats', async () => {
    const mockUser = { id: 1, role: 'user', firebaseUid: 'test-uid' };
    prisma.user.findUnique.mockResolvedValue(mockUser);
    
    // We mock the token verification result in setup.js to return test-uid for valid-token
    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Admin access required');
  });

  it('should allow an admin to access admin stats', async () => {
    const mockAdmin = { id: 2, role: 'admin', firebaseUid: 'admin-uid' };
    prisma.user.findUnique.mockResolvedValue(mockAdmin);
    
    // Using admin-token which returns admin-uid
    prisma.user.count.mockResolvedValue(10);
    prisma.problem.count.mockResolvedValue(5);
    prisma.interview.count.mockResolvedValue(2);

    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', 'Bearer admin-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalUsers');
  });

  it('should block an admin from super_admin routes (e.g., list users)', async () => {
    const mockAdmin = { id: 2, role: 'admin', firebaseUid: 'admin-uid' };
    prisma.user.findUnique.mockResolvedValue(mockAdmin);

    const res = await request(app)
      .get('/admin/users')
      .set('Authorization', 'Bearer admin-token');

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Super admin access required');
  });
});
