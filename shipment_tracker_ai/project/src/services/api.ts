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
      
      // Create a fallback call record instead of throwing an error
      const fallbackCall: Call = {
        sid: `local_${Date.now()}`,
        to: to,
        from: 'system',
        status: 'failed',
        duration: 0,
        timestamp: new Date().toISOString(),
        message: message || 'Call failed - server error'
      };
      
      // Store in localStorage as a backup
      try {
        const storedCalls = JSON.parse(localStorage.getItem('fallbackCalls') || '[]');
        storedCalls.push(fallbackCall);
        localStorage.setItem('fallbackCalls', JSON.stringify(storedCalls));
      } catch (e) {
        console.warn('Could not store fallback call in localStorage');
      }
      
      return fallbackCall;
    }
  },

  getCalls: async (): Promise<Call[]> => {
    try {
      const response = await api.get(getApiUrl(API_CONFIG.ENDPOINTS.CALLS));
      return response.data.calls;
    } catch (error) {
      console.error('Error getting calls:', error);
      
      // Return fallback calls from localStorage if the API fails
      try {
        const fallbackCalls = JSON.parse(localStorage.getItem('fallbackCalls') || '[]');
        return fallbackCalls;
      } catch (e) {
        console.warn('Could not retrieve fallback calls from localStorage');
        return [];
      }
    }
  },
};

export default api; 