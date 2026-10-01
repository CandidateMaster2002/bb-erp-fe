import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'https://bb-erp-be.onrender.com/api';

if (import.meta.env.DEV) {
  const target = localStorage.getItem('backend_target') || 'deployed';
  baseURL = target === 'local' ? 'http://localhost:8080/api' : 'https://bb-erp-be.onrender.com/api';
}

const api = axios.create({
  baseURL,
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
