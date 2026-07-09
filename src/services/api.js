import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = localStorage.getItem('accessToken') || null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/change-password'];

function isPublicAuthRequest(config) {
  const url = config?.url || '';
  return PUBLIC_AUTH_PATHS.some((p) => url.includes(p));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 402) {
      const msg = error.response?.data?.message || '';
      if (msg.toLowerCase().includes('subscription')) {
        window.location.href = '/access-denied?reason=expired';
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 403) {
      const msg = (error.response?.data?.message || '').toLowerCase();
      if (msg.includes('blocked')) {
        window.location.href = '/access-denied?reason=blocked';
        return Promise.reject(error);
      }
      if (msg.includes('suspended')) {
        window.location.href = '/access-denied?reason=suspended';
        return Promise.reject(error);
      }
    }

    const original = error.config;

    // Do not attempt token refresh on public auth endpoints (e.g. failed login)
    if (isPublicAuthRequest(original)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh')
          .then((res) => {
            const token = res.data.data.accessToken;
            setAccessToken(token);
            return token;
          })
          .catch(() => {
            setAccessToken(null);
            window.location.href = '/login';
            return null;
          })
          .finally(() => { refreshPromise = null; });
      }
      const token = await refreshPromise;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
