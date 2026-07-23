// apiClient.js
// In production (Vercel), VITE_BACKEND_URL = "https://medai-ip.onrender.com"
// In development, VITE_BACKEND_URL = "" so Vite's proxy handles /api/* locally
const BASE = import.meta.env.VITE_BACKEND_URL || '';

export const apiFetch = (path, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const newOptions = {
    ...options,
    headers
  };
  
  return fetch(`${BASE}${path}`, newOptions).then(async res => {
    if (res.status === 401 && path !== '/api/auth/login') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('unauthorized'));
    }
    return res;
  });
};

// WebSocket helper — points to Render in prod, local in dev
export const getWsUrl = (path) => {
  if (import.meta.env.VITE_BACKEND_URL) {
    // Convert https:// → wss://  or  http:// → ws://
    const wsBase = import.meta.env.VITE_BACKEND_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');
    return `${wsBase}${path}`;
  }
  // Local dev: use current host (Vite proxy will forward /ws)
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}${path}`;
};
