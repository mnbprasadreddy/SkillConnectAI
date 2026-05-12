const interviewService = require('../src/services/interviewService');
const prisma = require('../src/config/database');

jest.mock('../src/config/database', () => {
  const mPrisma = {
    interview: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    interviewAnalytic: {
      upsert: jest.fn(),
    },
    report: {
      create: jest.fn(),
    },
  };
  mPrisma.$transaction = jest.fn((cb) => cb(mPrisma));
  return mPrisma;
});

describe('Interview Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an interview session', async () => {
    prisma.interview.findFirst.mockResolvedValueOnce(null);
    prisma.interview.create.mockResolvedValueOnce({ id: 1, userId: 1, status: 'in_progress' });

    const result = await interviewService.createSession(1, 'behavioral', 'Easy', 'Software Engineer');
    expect(result.id).toBe(1);
    expect(prisma.interview.create).toHaveBeenCalled();
  });

  it('should prevent duplicate active sessions', async () => {
    prisma.interview.findFirst.mockResolvedValueOnce({ id: 1, status: 'in_progress' });

    await expect(interviewService.createSession(1, 'behavioral', 'Easy', 'Role'))
      .rejects.toThrow('An interview is already in progress');
  });

  it('should save analytics data', async () => {
    prisma.interviewAnalytic.upsert.mockResolvedValueOnce({ id: 1 });

    const result = await interviewService.saveAnalytics(1, { eyeContactScore: 80 });
    expect(prisma.interviewAnalytic.upsert).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should end a session and generate a report', async () => {
    prisma.interview.findUnique.mockResolvedValueOnce({ id: 1, status: 'in_progress', userId: 1 });
    prisma.interview.update.mockResolvedValueOnce({ id: 1, status: 'completed' });
    prisma.report.create.mockResolvedValueOnce({ id: 1, interviewId: 1 });

    const result = await interviewService.endSession(1, { duration: 1800, score: 85, confidenceScore: 90 });
    expect(result.status).toBe('completed');
    expect(prisma.report.create).toHaveBeenCalled();
  });

  it('should handle invalid interview state handling', async () => {
    prisma.interview.update.mockRejectedValueOnce(new Error('Interview not found or unauthorized'));
    
    await expect(interviewService.endSession(999, {})).rejects.toThrow('Interview not found or unauthorized');
  });
});
