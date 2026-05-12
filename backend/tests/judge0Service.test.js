const judge0Service = require('../src/services/judge0Service');
const axios = require('axios');

jest.mock('axios');

describe('Judge0 Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should execute code successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { token: 'token-123' } });
    axios.get.mockResolvedValueOnce({
      data: { status: { id: 3 }, stdout: Buffer.from('Hello World\n').toString('base64'), time: '0.01', memory: 1024 },
    });

    const result = await judge0Service.runCode('python', 'print("Hello World")');
    expect(result.result).toBe('accepted');
    expect(result.stdout).toBe('Hello World\n');
  });

  it('should handle compile errors', async () => {
    axios.post.mockResolvedValueOnce({ data: { token: 'token-error' } });
    axios.get.mockResolvedValueOnce({
      data: { status: { id: 6 }, compile_output: Buffer.from('SyntaxError: invalid syntax').toString('base64') },
    });

    const result = await judge0Service.runCode('python', 'print(Hello');
    expect(result.result).toBe('compilation_error');
    expect(result.compileOutput).toBe('SyntaxError: invalid syntax');
  });

  it('should handle timeout handling', async () => {
    axios.post.mockResolvedValueOnce({ data: { token: 'token-timeout' } });
    axios.get.mockResolvedValueOnce({
      data: { status: { id: 5 }, message: 'Time Limit Exceeded' },
    });

    const result = await judge0Service.runCode('python', 'while True: pass');
    expect(result.result).toBe('time_limit_exceeded');
  });

  it('should handle malformed payload fallback', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'));

    await expect(judge0Service.runCode('python', '')).rejects.toThrow('Judge0 network/timeout error');
  });

  it('should process batch submission flow', async () => {
    axios.post.mockResolvedValueOnce({
      data: [{ token: 't1' }, { token: 't2' }]
    });
    // Polls 1
    axios.get.mockResolvedValueOnce({
      data: { status: { id: 3 }, stdout: Buffer.from('Out1').toString('base64') }
    });
    // Polls 2
    axios.get.mockResolvedValueOnce({
      data: { status: { id: 4 }, stderr: Buffer.from('Wrong Answer').toString('base64') }
    });

    const testCases = [
      { id: 1, input: 'in1', expectedOutput: 'Out1' },
      { id: 2, input: 'in2', expectedOutput: 'Out2' }
    ];

    const results = await judge0Service.batchEvaluate('python', 'code', testCases, 'Easy');
    expect(results).toHaveLength(2);
    expect(results[0].result).toBe('accepted');
    expect(results[1].result).toBe('wrong_answer');
  });
});
