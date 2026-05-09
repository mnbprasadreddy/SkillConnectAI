const axios = require('axios');
axios.get('https://ce.judge0.com/about', { timeout: 5000 })
  .then(res => console.log('Success:', res.data.version))
  .catch(err => console.error('Error:', err.message));
