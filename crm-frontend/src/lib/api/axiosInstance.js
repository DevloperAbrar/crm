import axios from 'axios';
import { toast } from 'react-toastify';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const isAuthEndpoint = (url = '') =>
  url.includes('/auth/login') || url.includes('/auth/google') || url.includes('/auth/refresh');

api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;

    if (
      err.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    // Global fallback toast: fires for any error NOT already handled by the
    // calling component (those pass `skipErrorToast: true` in their request
    // config after showing their own, more specific message).
    if (!originalRequest?.skipErrorToast) {
      if (!err.response) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (err.response.status === 403) {
        toast.error(err.response?.data?.message || "You don't have permission to do that.");
      } else if (err.response.status >= 500) {
        toast.error('Something went wrong on our end. Please try again shortly.');
      } else if (err.response.status !== 401) {
        // 401 on a non-refreshable request already ends up at /login above;
        // everything else (400/404/409 etc.) gets a generic toast unless
        // the calling code already handled it.
        toast.error(err.response?.data?.message || 'Something went wrong.');
      }
    }

    return Promise.reject(err);
  }
);

export default api;