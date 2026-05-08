import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // We will get the token from our AuthContext later
    const token = localStorage.getItem('skillconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'Something went wrong';
    console.error('API Error:', message);
    
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., logout)
      localStorage.removeItem('skillconnect_token');
    }
    
    return Promise.reject(error);
  }
);

export default api;
