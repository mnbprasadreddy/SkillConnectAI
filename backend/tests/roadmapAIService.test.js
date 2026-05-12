const { generateRoadmap } = require('../src/services/roadmapAIService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Roadmap AI Service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return a fallback roadmap if GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await generateRoadmap('React');
    
    expect(result.modules).toHaveLength(5);
    expect(result.description).toContain('Structured learning path');
  });

  it('should return a fallback roadmap if Gemini call fails', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';
    axios.post.mockRejectedValue(new Error('API Error'));

    const result = await generateRoadmap('Node.js');

    expect(result.modules).toHaveLength(5);
    expect(result.topic).toBe('Node.js');
  });

  it('should parse and return Gemini response if successful', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';
    
    const mockData = {
      topic: 'Testing',
      description: 'Test Roadmap',
      modules: [
        { title: 'Intro', description: 'Basics', difficulty: 'Beginner', estimatedHours: 1 }
      ]
    };

    axios.post.mockResolvedValue({
      data: {
        candidates: [{
          content: { parts: [{ text: JSON.stringify(mockData) }] }
        }]
      }
    });

    const result = await generateRoadmap('Testing');

    expect(result.topic).toBe('Testing');
    expect(result.modules[0].title).toBe('Intro');
    expect(result.totalModules).toBe(1);
  });
});
