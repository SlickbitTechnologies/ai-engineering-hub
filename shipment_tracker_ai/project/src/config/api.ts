export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL ,
  TIMEOUT: 10000,
  ENDPOINTS: {
    CALLS: '/calls',
    SHIPMENTS: '/shipments',
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      RESET_PASSWORD: '/auth/reset-password'
    }
  }
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 