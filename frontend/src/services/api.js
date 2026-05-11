import axios from 'axios';
import { getIdToken } from 'firebase/auth';
import { auth } from './firebase';

// Dynamically determine the default API URL based on the environment
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultApiUrl = isLocalhost ? 'http://localhost:5000/api' : `${window.location.origin}/api`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — always get a FRESH Firebase token ─────────────────
// Firebase.getIdToken() is internally cached: it only hits the network when
// the token is within 5 minutes of expiry. Cost = ~0ms for valid sessions.
api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // force=false: uses cached token unless near expiry (Firebase manages refresh)
        const freshToken = await getIdToken(currentUser, false);
        if (freshToken) {
          config.headers.Authorization = `Bearer ${freshToken}`;
          // Keep localStorage in sync so other code reading it stays current
          localStorage.setItem('skillconnect_token', freshToken);
          console.log('[AUTH] Authorization header attached (Firebase token)');
          return config;
        }
      }
    } catch (tokenErr) {
      console.warn('[AUTH] Firebase getIdToken failed, trying localStorage fallback:', tokenErr.message);
    }

    // Fallback: use whatever is in localStorage (covers edge cases)
    const cached = localStorage.getItem('skillconnect_token');
    if (cached) {
      config.headers.Authorization = `Bearer ${cached}`;
      console.log('[AUTH] Authorization header attached (localStorage fallback)');
    } else {
      console.warn('[AUTH] No token available — request will be sent without Authorization header');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    const payload = response.data;

    if (payload && typeof payload === 'object' && 'success' in payload) {
      if (!('data' in payload)) payload.data = null;
      return payload;
    }

    return { success: true, data: payload };
  },
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.error || 'Something went wrong';
    console.error('[API] Error:', status, message);

    if (status === 401) {
      console.warn('[AUTH] 401 received — token expired or invalid. Clearing local token.');
      localStorage.removeItem('skillconnect_token');
      // Don't redirect here — let the calling component handle it gracefully
    }

    return Promise.reject(error);
  }
);

export default api;
