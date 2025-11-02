import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://access-unified.preview.emergentagent.com/api';

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
      // Handle 401 silently - this is expected when not logged in or token expired
      if (typeof window !== 'undefined') {
        const hasToken = localStorage.getItem('session_token');
        const onLoginPage = window.location.pathname.includes('/login');
        
        if (hasToken) {
          // Token is invalid, clear it
          localStorage.removeItem('session_token');
          localStorage.removeItem('user');
          
          // Redirect to login only if not already there
          if (!onLoginPage) {
            console.log('Session expired. Redirecting to login...');
            window.location.href = '/login';
          }
        }
        // If no token exists, this is expected - user needs to log in
      }
    } else if (error.response?.status >= 500) {
      // Only log server errors (5xx)
      console.error('Server Error:', error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default api;
