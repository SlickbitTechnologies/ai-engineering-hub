import { getIdToken } from '@/app/firebase/auth';

/**
 * Makes an authenticated fetch request to the API with the user's Firebase ID token
 * @param url The URL to fetch
 * @param options The fetch options
 * @returns A Promise with the fetch response
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
        // Get the authentication token
        const token = await getIdToken(true);

        if (!token) {
            console.error('Authentication error: No token available');
            throw new Error('You must be logged in to use this feature');
        }

        // Create headers with authentication
        const headers = {
            ...(options.headers || {}),
            'Authorization': `Bearer ${token}`
        };

        // Make the authenticated request
        return fetch(url, {
            ...options,
            headers
        });
    } catch (error) {
        console.error('Auth fetch error:', error);
        throw error;
    }
} 