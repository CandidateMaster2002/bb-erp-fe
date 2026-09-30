import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

// Attach token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Backend returned 401 Unauthorized. Ignoring redirect to prevent loop.");
      // localStorage.removeItem('token');
      // Redirect to login if not already there
      // if (window.location.pathname !== '/login') {
      //  window.location.href = '/login';
      // }
    }
    return Promise.reject(error);
  }
);

export default api;
