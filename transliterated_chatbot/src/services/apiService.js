import axios from 'axios';
import { getCurrentUser } from './firebaseAuth';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:4001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const user = getCurrentUser();
    console.log('User::::', user);
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Chat API endpoints
export const chatApi = {
  sendMessage: async (message) => {
    try {
      const response = await api.post('/chat', { message });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
};

// Restaurant Settings API endpoints
export const restaurantApi = {
  saveSettings: async (formData) => {
    try {
      const response = await api.post('/restaurant/settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error saving restaurant settings:', error);
      throw error;
    }
  },

  getSettings: async (userId) => {
    try {
      const response = await api.get(`/restaurant/settings/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant settings:', error);
      throw error;
    }
  },

  updateSettings: async (userId, formData) => {
    try {
      const response = await api.put(`/restaurant/settings/${userId}`, formData);

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },
};

// User API endpoints
export const userApi = {
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
};

// Analytics API endpoints
export const analyticsApi = {
  getSentimentAnalysis: async () => {
    try {
      const response = await api.get('/analytics/sentiment');
      return response.data;
    } catch (error) {
      console.error('Error fetching sentiment analysis:', error);
      throw error;
    }
  },
}; 