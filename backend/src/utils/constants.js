// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Application Constants
// ═══════════════════════════════════════════════════════════════

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

const INTERVIEW_TYPES = ['behavioral', 'technical', 'system_design', 'coding', 'hr'];

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const SUBMISSION_RESULTS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  WRONG_ANSWER: 'wrong_answer',
  TIME_LIMIT: 'time_limit_exceeded',
  MEMORY_LIMIT: 'memory_limit_exceeded',
  RUNTIME_ERROR: 'runtime_error',
  COMPILATION_ERROR: 'compilation_error',
};

const CONTEST_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

const RECOMMENDATION_TYPES = {
  PROBLEM: 'problem',
  INTERVIEW: 'interview',
  TOPIC: 'topic',
  GENERAL: 'general',
};

const JUDGE0_STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
};

// Map Judge0 status IDs to our result strings
const mapJudge0Status = (statusId) => {
  switch (statusId) {
    case 3: return SUBMISSION_RESULTS.ACCEPTED;
    case 4: return SUBMISSION_RESULTS.WRONG_ANSWER;
    case 5: return SUBMISSION_RESULTS.TIME_LIMIT;
    case 6: return SUBMISSION_RESULTS.COMPILATION_ERROR;
    case 7: case 8: case 9: case 10: case 11: case 12:
      return SUBMISSION_RESULTS.RUNTIME_ERROR;
    default: return SUBMISSION_RESULTS.PENDING;
  }
};

const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 50,
};

module.exports = {
  DIFFICULTY_LEVELS,
  INTERVIEW_TYPES,
  SKILL_LEVELS,
  SUBMISSION_RESULTS,
  CONTEST_STATUS,
  RECOMMENDATION_TYPES,
  JUDGE0_STATUS,
  mapJudge0Status,
  PAGINATION_DEFAULTS,
};
