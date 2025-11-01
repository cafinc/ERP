import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mapbuilder-3.preview.emergentagent.com/api';

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
    if (error.response?.status === 401) {
      // Only redirect to login if we're not already there and token exists
      if (typeof window !== 'undefined') {
        const hasToken = localStorage.getItem('session_token');
        const onLoginPage = window.location.pathname.includes('/login');
        
        if (hasToken) {
          // Token is invalid, clear it
          localStorage.removeItem('session_token');
          localStorage.removeItem('user');
          
          // Redirect to login only if not already there
          if (!onLoginPage) {
            window.location.href = '/login';
          }
        }
        // If no token, don't redirect (user is already logged out)
      }
    } else {
      // Log other errors
      console.error('API Error:', error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default api;
