// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Interview Execution Service
// ═══════════════════════════════════════════════════════════════
// STRICT ISOLATION: This wrapper ensures that live coding interviews 
// do NOT interfere with the existing Problems Library Judge0 pipeline.
// ═══════════════════════════════════════════════════════════════

const judge0Service = require('./judge0Service');
const logger = require('../utils/logger');

/**
 * Executes code for the Live Interview environment.
 * Includes graceful degradation and resource limits.
 */
const executeInterviewCode = async (language, sourceCode, stdin = '') => {
  try {
    // strict limits to protect free-tier resources during an interview
    const limits = { cpu_time_limit: 5, memory_limit: 256000 };
    
    const result = await judge0Service.runCode(language, sourceCode, stdin, limits);
    
    return {
      success: true,
      data: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        compileOutput: result.compileOutput || '',
        message: result.message || '',
        status: result.result,
        runtime: result.runtime,
        memory: result.memory
      }
    };
  } catch (error) {
    logger.error('[Interview Execution Wrapper] Error:', error.message);
    
    // Fail gracefully without throwing 500s that crash the frontend
    return {
      success: false,
      data: {
        stdout: '',
        stderr: 'Execution Service Unreachable: ' + (error.message || 'Unknown network error. Please continue verbal explanation.'),
        compileOutput: '',
        status: 'runtime_error',
        runtime: '0s',
        memory: '0 MB'
      }
    };
  }
};

module.exports = {
  executeInterviewCode
};
