import { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { SerializedError } from '@reduxjs/toolkit';

/**
 * API error response shape
 */
export interface ApiError {
  status: number | string;
  message: string;
  data?: any;
}

/**
 * Parses and formats an error from RTK Query into a standardized format
 */
export const parseApiError = (error: FetchBaseQueryError | SerializedError | undefined): ApiError => {
  console.log('API Error:', error);
  
  if (!error) {
    return {
      status: 'unknown',
      message: 'An unknown error occurred'
    };
  }

  // Handle FetchBaseQueryError
  if ('status' in error) {
    // Server responded with an error status
    if (typeof error.status === 'number') {
      const data = error.data as any;
      return {
        status: error.status,
        message: data?.detail || data?.message || getErrorMessageFromStatus(error.status),
        data: data
      };
    }
    
    // Request failed (network error, timeout, etc)
    return {
      status: 'fetch-error',
      message: 'Network error or server unavailable'
    };
  }

  // Handle SerializedError
  if ('message' in error) {
    return {
      status: 'client-error',
      message: error.message || 'An unknown error occurred'
    };
  }

  // Fallback
  return {
    status: 'unknown',
    message: 'An unknown error occurred'
  };
};

/**
 * Gets a human-readable error message based on HTTP status code
 */
const getErrorMessageFromStatus = (status: number): string => {
  switch (status) {
    case 400:
      return 'Bad request - The server could not understand the request';
    case 401:
      return 'Unauthorized - Authentication is required';
    case 403:
      return 'Forbidden - You do not have permission to access this resource';
    case 404:
      return 'Not found - The requested resource was not found';
    case 409:
      return 'Conflict - The request conflicts with the current state of the server';
    case 422:
      return 'Validation error - The request was well-formed but contains semantic errors';
    case 500:
      return 'Server error - Something went wrong on the server';
    default:
      return `Error ${status} - Something went wrong`;
  }
}; 