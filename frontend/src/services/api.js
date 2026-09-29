import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
});
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('maz-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/auth/login') {
      sessionStorage.removeItem('maz-token');
      window.dispatchEvent(new Event('maz-session-expired'));
    }
    return Promise.reject(error);
  },
);
export const errorMessage = (error) =>
  error.response?.data?.message ||
  (error.code === 'ECONNABORTED'
    ? 'El servidor tardó demasiado. Intenta nuevamente.'
    : 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
export const money = (value) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
export const dateTime = (value) =>
  new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
