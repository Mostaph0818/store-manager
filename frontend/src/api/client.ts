import axios, { AxiosError } from 'axios';

// For Netlify, API calls go through /api/ which redirects to functions
// For local dev, use VITE_API_URL or default to localhost:3000
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 
  (window.location.hostname.includes('netlify.app') ? '/api' : 'http://localhost:3000/api');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiration and formatted errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    if (error.response?.status === 401) {
      // Clear token and redirect if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'حدث خطأ غير متوقع';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
