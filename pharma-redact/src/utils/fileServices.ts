/**
 * File Services
 * 
 * This file provides utility functions for working with documents and files
 * using the SQLite-based API endpoints instead of localStorage.
 */

import { Document } from '@/types/document';

/**
 * Upload a file to the server
 * @param file The file to upload
 * @returns The document object created
 */
export const uploadDocument = async (file: File): Promise<Document> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const { token, headers } = await getAuthTokenAndHeaders();

        console.log('Uploading document:', file.name, file.size, 'bytes');
        const response = await fetch('/api/documents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...headers
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }));
            console.error('Upload failed:', errorData);
            throw new Error(errorData.error || `Failed to upload document: ${response.status}`);
        }

        const result = await response.json();
        console.log('Upload successful, document ID:', result.id);
        return result;
    } catch (error) {
        console.error('Error in uploadDocument:', error);
        throw error;
    }
};

/**
 * Get all documents for the current user
 * @returns List of document objects
 */
export const getDocuments = async (): Promise<Document[]> => {
    const { token, headers } = await getAuthTokenAndHeaders();

    const response = await fetch('/api/documents', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...headers
        }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch documents');
    }

    return await response.json();
};

/**
 * Get a specific document by ID
 * @param documentId The document ID
 * @returns The document object
 */
export const getDocumentById = async (documentId: string): Promise<Document> => {
    const { token, headers } = await getAuthTokenAndHeaders();

    // Sanitize document ID
    const sanitizedId = String(documentId).trim();
    console.log(`API Service: Getting document by ID ${sanitizedId} (length: ${sanitizedId.length})`);

    const response = await fetch(`/api/documents/${sanitizedId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...headers
        }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch document');
    }

    return await response.json();
};

/**
 * Save a redacted document
 * @param documentId The original document ID
 * @param redactedFile The redacted file
 * @param summary The redaction summary
 * @returns The updated document object
 */
export const saveRedactedDocument = async (
    documentId: string,
    redactedFile: File,
    summary: string
): Promise<Document> => {
    const { token, headers } = await getAuthTokenAndHeaders();

    // Sanitize document ID
    const sanitizedId = String(documentId).trim();
    console.log(`API Service: Saving redacted document for ID ${sanitizedId} (length: ${sanitizedId.length})`);

    const formData = new FormData();
    formData.append('redactedFile', redactedFile);
    formData.append('summary', summary);

    const response = await fetch(`/api/documents/${sanitizedId}/redact`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...headers
        },
        body: formData
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save redacted document');
    }

    return await response.json();
};

/**
 * Delete a document
 * @param documentId The document ID
 * @returns True if successful
 */
export const deleteDocument = async (documentId: string): Promise<boolean> => {
    const { token, headers } = await getAuthTokenAndHeaders();

    // Sanitize document ID
    const sanitizedId = String(documentId).trim();
    console.log(`API Service: Deleting document with ID ${sanitizedId} (length: ${sanitizedId.length})`);

    const response = await fetch(`/api/documents/${sanitizedId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            ...headers
        }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete document');
    }

    return true;
};

/**
 * Get a URL for downloading a document
 * @param documentId The document ID
 * @param original Whether to download the original file (true) or redacted file (false)
 * @returns URL to download the file
 */
export const getDownloadUrl = (documentId: string, original: boolean = false): string => {
    return original
        ? `/api/documents/${documentId}/download-original`
        : `/api/documents/${documentId}/download`;
};

/**
 * Helper method to get the authentication token and any extra headers
 */
const getAuthTokenAndHeaders = async (): Promise<{ token: string; headers: Record<string, string> }> => {
    try {
        // Initialize headers
        const headers: Record<string, string> = {};

        // Get the current Firebase user
        const user = (window as any).firebase?.auth()?.currentUser;

        if (user) {
            console.log('User authenticated, getting token');
            // Store the user ID in localStorage for development mode fallback
            if (process.env.NODE_ENV === 'development') {
                localStorage.setItem('firebase-user-id', user.uid);
                console.log(`Development mode: Stored user ID ${user.uid} in localStorage`);
            }
            return { token: await user.getIdToken(), headers };
        }

        // Fallback for development mode
        if (process.env.NODE_ENV === 'development') {
            console.warn('Using development fallback authentication');

            // Get the user ID from localStorage if available
            const storedUserId = localStorage.getItem('firebase-user-id');
            if (storedUserId) {
                console.log(`Development mode: Using stored user ID ${storedUserId}`);
                // Add the user ID as a header
                headers['x-user-id'] = storedUserId;
            }

            return { token: 'dev-auth-token', headers };
        }

        console.error('Authentication failed: No user found');
        throw new Error('User not authenticated');
    } catch (error) {
        console.error('Error getting auth token:', error);

        // Fallback for development mode
        if (process.env.NODE_ENV === 'development') {
            console.warn('Using development fallback authentication after error');
            const headers: Record<string, string> = {};

            // Get the user ID from localStorage if available
            const storedUserId = localStorage.getItem('firebase-user-id');
            if (storedUserId) {
                console.log(`Development mode: Using stored user ID ${storedUserId} after error`);
                // Add the user ID as a header
                headers['x-user-id'] = storedUserId;
            }

            return { token: 'dev-auth-token', headers };
        }

        throw error;
    }
};

// Keep the original function for backward compatibility
const getAuthToken = async (): Promise<string> => {
    const { token } = await getAuthTokenAndHeaders();
    return token;
}; 