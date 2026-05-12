const { verifyToken } = require('../src/middleware/authMiddleware');
const admin = require('../src/config/firebase');
const prisma = require('../src/config/database');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should pass if a valid token is provided and user exists in DB', async () => {
    req.headers.authorization = 'Bearer valid-token';
    const mockDbUser = { id: 1, firebaseUid: 'test-uid', email: 'test@example.com' };
    
    prisma.user.findUnique.mockResolvedValue(mockDbUser);

    await verifyToken(req, res, next);

    expect(admin.auth().verifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(mockDbUser);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if no authorization header is present', async () => {
    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Unauthorized: No token provided'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    
    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Unauthorized: Invalid or expired token'
    }));
    expect(next).not.toHaveBeenCalled();
  });
});
