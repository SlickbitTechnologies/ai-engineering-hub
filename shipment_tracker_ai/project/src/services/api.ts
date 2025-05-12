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

export interface ShipmentDetails {
  shipmentNumber: string;
  detectedTemperature: string;
  timeDate: string;
  temperatureRange: string;
  personName: string;
}

export interface Call {
  sid: string;
  id?: string;  // Add id field which may be present in some API responses
  to: string;
  from: string;
  status: string;
  duration: number;
  timestamp: string;
  message: string;
  recipient?: string; // Used in some places
  shipmentDetails?: ShipmentDetails;
}

export const callApi = {
  makeCall: async (to: string, message?: string, shipmentDetails?: ShipmentDetails): Promise<Call> => {
    try {
      console.log("Making call with shipment details:", shipmentDetails);
      
      const response = await api.post(getApiUrl(API_CONFIG.ENDPOINTS.CALLS), { 
        to, 
        message,
        shipmentDetails 
      });
      const callData = response.data.call;
      console.log("Call API response:", callData);
      
      // Set up status polling if we have a valid call SID
      if (callData && callData.id) {
        // Poll status a few times, then stop
        let pollCount = 0;
        const pollStatus = async () => {
          try {
            if (pollCount < 5) { // Try up to 5 times
              const updatedCall = await callApi.getCallStatus(callData.id);
              if (updatedCall && updatedCall.status && updatedCall.status !== 'queued' && updatedCall.status !== 'ringing') {
                // Got a terminal status, no need to poll more
                return;
              }
              // Schedule next poll
              pollCount++;
              setTimeout(pollStatus, 5000); // Poll every 5 seconds
            }
          } catch (e) {
            console.warn('Error polling call status:', e);
          }
        };
        
        // Start polling after a delay
        setTimeout(pollStatus, 5000);
      }
      
      return callData;
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
        message: message || 'Call failed - server error',
        shipmentDetails
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

  getCallStatus: async (callSid: string): Promise<Call | null> => {
    try {
      const response = await api.get(getApiUrl(`${API_CONFIG.ENDPOINTS.CALLS}/${callSid}/status`));
      if (response.data.success && response.data.call) {
        // Update the call in localStorage cache as well
        try {
          const storedCalls = JSON.parse(localStorage.getItem('fallbackCalls') || '[]');
          const callIndex = storedCalls.findIndex((c: Call) => c.sid === callSid);
          if (callIndex >= 0) {
            storedCalls[callIndex] = response.data.call;
            localStorage.setItem('fallbackCalls', JSON.stringify(storedCalls));
          }
        } catch (e) {
          console.warn('Could not update call in localStorage');
        }
        return response.data.call;
      }
      return null;
    } catch (error) {
      console.error('Error getting call status:', error);
      return null;
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