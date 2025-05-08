import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, getApiUrl } from '../config/api';

// Create axios instance with configuration
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Call {
  sid: string;
  to: string;
  from: string;
  status: string;
  duration: number;
  timestamp: string;
  message: string;
}

export const callApi = {
  makeCall: async (to: string, message?: string): Promise<Call> => {
    try {
      const response = await api.post(getApiUrl(API_CONFIG.ENDPOINTS.CALLS), { to, message });
      return response.data.call;
    } catch (error) {
      console.error('Error making call:', error);
      throw error;
    }
  },

  getCalls: async (): Promise<Call[]> => {
    try {
      const response = await api.get(getApiUrl(API_CONFIG.ENDPOINTS.CALLS));
      return response.data.calls;
    } catch (error) {
      console.error('Error getting calls:', error);
      throw error;
    }
  },
};

export default api; 