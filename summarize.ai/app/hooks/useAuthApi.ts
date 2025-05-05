import { useState, useCallback } from 'react';
import { quotaAwareFetch } from '../lib/quotaHelper';
import { authFetch } from '../lib/authFetch';

interface UseAuthApiOptions {
    onQuotaExceeded?: () => void;
    onAuthError?: () => void;
}

interface ApiResponse<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    execute: (url: string, fetchOptions?: RequestInit) => Promise<T | null>;
}

/**
 * Custom hook for making authenticated API calls with proper error handling
 * @param hookOptions Optional configuration options for the hook
 * @returns Object with data, loading state, error, and execute function
 */
export function useAuthApi<T = any>(hookOptions?: UseAuthApiOptions): ApiResponse<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (url: string, fetchOptions?: RequestInit): Promise<T | null> => {
        try {
            setLoading(true);
            setError(null);

            // Use the quotaAwareFetch to handle quotas and authentication together
            const response = await quotaAwareFetch(
                url,
                fetchOptions,
                hookOptions?.onQuotaExceeded
            );

            // Handle authentication errors
            if (response.status === 401) {
                console.error('Authentication error from API:', url);
                const errorData = await response.json();
                setError(errorData.message || 'Authentication failed. Please sign in again.');
                if (hookOptions?.onAuthError) {
                    hookOptions.onAuthError();
                }
                return null;
            }

            // Handle other error responses
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
            }

            // Parse and set successful response data
            const result = await response.json();
            setData(result);
            return result;
        } catch (err: any) {
            const errorMessage = err.message || 'An unexpected error occurred';
            console.error('API request error:', errorMessage);
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [hookOptions]);

    return { data, loading, error, execute };
}

export default useAuthApi; 