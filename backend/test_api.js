const axios = require('axios');
axios.get('http://localhost:5000/api/problems')
  .then(res => console.log(JSON.stringify(res.data, null, 2)))
  .catch(err => console.error(err.response?.data || err.message));
