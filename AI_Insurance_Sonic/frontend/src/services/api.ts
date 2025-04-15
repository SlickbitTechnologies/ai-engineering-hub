import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Dynamically determine the frontend port
const currentPort = window.location.port || '3000';
const isFrontendDev = currentPort === '5173' || currentPort === '5174'; // Vite dev server ports

// API base URL configuration
export const API_BASE_URL = 'http://localhost:4000';
export const API_PREFIX = '/api/v1';

// Create a reusable base query with the API base URL and prefix
export const baseQuery = fetchBaseQuery({ 
  baseUrl: `${API_BASE_URL}${API_PREFIX}`,
  // Add default headers if needed
  prepareHeaders: (headers, { endpoint }) => {
    // For FormData requests, let the browser set the Content-Type
    // We check this in the uploadFiles endpoint specifically
    if (endpoint !== 'uploadFiles') {
    headers.set('Content-Type', 'application/json');
    }
    return headers;
  },
  // For CORS issues: only use credentials when needed for auth
  // If you're having CORS issues, try changing this to 'same-origin' or 'omit'
  credentials: 'same-origin',
});

// Helper function to create full API URL for direct fetch calls
export const createApiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const formattedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}${API_PREFIX}/${formattedPath}`;
};

// Function for direct fetch calls with customizable options
export const fetchApi = async (
  path: string, 
  options: RequestInit = {}
): Promise<any> => {
  const url = createApiUrl(path);
  
  // Default options with better CORS handling
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
  };

  // For FormData, we don't set Content-Type to let the browser handle it
  if (options.body instanceof FormData) {
    const headers = defaultOptions.headers as Record<string, string>;
    delete headers['Content-Type'];
  }
  
  // Merge default options with provided options
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the JSON response
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Log API configuration on initialization (useful for debugging)
console.log('API Configuration:', {
  baseUrl: `${API_BASE_URL}${API_PREFIX}`,
  frontendPort: currentPort,
  isDevelopment: isFrontendDev,
}); 