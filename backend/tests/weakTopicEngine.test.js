const { analyzeUser } = require('../src/services/weakTopicEngine');
const prisma = require('../src/config/database');

describe('Weak Topic Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should classify topics as weak if performance is low', async () => {
    const userId = 1;
    
    // Mock user
    prisma.user.findUnique.mockResolvedValue({ id: userId, accuracy: 40, skillLevel: 'Beginner' });
    
    // Mock submissions (failed "Recursion" problems)
    prisma.submission.findMany.mockResolvedValue([
      { result: 'wrong_answer', problem: { topic: 'Recursion', id: 101 } },
      { result: 'time_limit_exceeded', problem: { topic: 'Recursion', id: 101 } },
    ]);
    
    // Mock other parallel queries with empty sets
    prisma.contestSubmission.findMany.mockResolvedValue([]);
    prisma.interview.findMany.mockResolvedValue([]);
    
    // Mock transaction/upsert
    prisma.$transaction = jest.fn().mockResolvedValue([]);

    const result = await analyzeUser(userId);

    expect(result.weakTopics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ topic: 'Recursion', severity: 'critical' })
      ])
    );
  });

  it('should handle empty datasets gracefully', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    prisma.submission.findMany.mockResolvedValue([]);
    prisma.contestSubmission.findMany.mockResolvedValue([]);
    prisma.interview.findMany.mockResolvedValue([]);

    const result = await analyzeUser(1);

    expect(result.allTopics).toHaveLength(0);
    expect(result.weakTopics).toHaveLength(0);
  });
});
