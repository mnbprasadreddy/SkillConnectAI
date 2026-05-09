import axios from 'axios';

// Dynamically determine the default API URL based on the environment
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultApiUrl = isLocalhost ? 'http://localhost:5000/api' : `${window.location.origin}/api`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
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
  (response) => {
    const payload = response.data;
    
    // If it's already a standard SkillConnect API response shape
    if (payload && typeof payload === 'object' && 'success' in payload) {
      // Always ensure there is a .data property even if null
      if (!('data' in payload)) {
        payload.data = null;
      }
      return payload;
    }
    
    // If backend returns raw data (array or object) without wrapper, normalize it
    return {
      success: true,
      data: payload,
    };
  },
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
