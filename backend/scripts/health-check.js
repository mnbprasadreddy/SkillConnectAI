const axios = require('axios');

async function checkHealth() {
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api/health';
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/ai/health';

  console.log('🔍 Starting System Health Diagnostics...');

  const checks = [
    { name: 'Main Backend', url: BACKEND_URL },
    { name: 'AI Service', url: AI_SERVICE_URL }
  ];

  for (const check of checks) {
    try {
      const start = Date.now();
      const response = await axios.get(check.url, { timeout: 5000 });
      const duration = Date.now() - start;
      console.log(`✅ ${check.name}: ONLINE (${duration}ms) - Status: ${response.data.status || 'OK'}`);
    } catch (err) {
      console.error(`❌ ${check.name}: OFFLINE - ${err.message}`);
    }
  }

  console.log('─────────────────────────────────────────');
}

checkHealth();
