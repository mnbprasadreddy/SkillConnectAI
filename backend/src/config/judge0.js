// ═══════════════════════════════════════════════════════════════
// SkillConnect AI — Judge0 API Configuration
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();

const judge0Config = {
  baseUrl: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
  apiKey: process.env.JUDGE0_API_KEY || '',
  apiHost: process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',

  // Language ID mappings for Judge0 CE
  languages: {
    'javascript': 63,   // Node.js
    'python': 71,        // Python 3
    'python3': 71,
    'java': 62,          // Java (OpenJDK 13)
    'cpp': 54,           // C++ (GCC 9.2.0)
    'c': 50,             // C (GCC 9.2.0)
    'csharp': 51,        // C# (Mono 6.6)
    'ruby': 72,          // Ruby (2.7.0)
    'go': 60,            // Go (1.13.5)
    'rust': 73,          // Rust (1.40.0)
    'typescript': 74,    // TypeScript (3.7.4)
    'php': 68,           // PHP (7.4.1)
    'swift': 83,         // Swift (5.2.3)
    'kotlin': 78,        // Kotlin (1.3.70)
    'scala': 81,         // Scala (2.13.2)
  },

  // Default headers for Judge0 RapidAPI
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': this.apiHost,
    };
  },

  // Get language ID from name
  getLanguageId(language) {
    const normalized = language.toLowerCase().trim();
    return this.languages[normalized] || null;
  },
};

module.exports = judge0Config;
