import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://webadmin-rescue.preview.emergentagent.com/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include session token
api.interceptors.request.use(
  (config) => {
    // Get session token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('session_token');
      console.log('API Request:', config.url, 'Token:', token ? `${token.substring(0, 10)}...` : 'NONE');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('session_token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
