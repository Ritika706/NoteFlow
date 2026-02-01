import axios from 'axios';
import { getToken } from './auth';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const baseUrl = String(rawBaseUrl).trim().replace(/\/+$/, '');

const api = axios.create({
  baseURL: baseUrl,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api };
export { baseUrl as apiBaseUrl };
