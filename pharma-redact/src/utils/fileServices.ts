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
 * Download a document with proper authentication
 * @param documentId The document ID
 * @param original Whether to download the original file (true) or redacted file (false)
 */
export const downloadDocument = async (documentId: string, original: boolean = false): Promise<void> => {
    const { token, headers } = await getAuthTokenAndHeaders();
    const endpoint = original
        ? `/api/documents/${documentId}/download-original`
        : `/api/documents/${documentId}/download`;

    // Track attempts for retries
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        console.log(`Download attempt ${attempts}/${maxAttempts} for document ${documentId}`);

        try {
            // Create fetch request with authentication headers
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...headers
                },
                cache: 'no-cache'
            });

            if (!response.ok) {
                // Try to get detailed error information
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    console.error('Download error details:', errorData);

                    // If we're getting a 401/403 auth error, try token refresh
                    if (response.status === 401 || response.status === 403) {
                        if (attempts < maxAttempts) {
                            console.log('Auth error, refreshing token and retrying...');
                            // Force token refresh in development mode
                            if (process.env.NODE_ENV === 'development') {
                                localStorage.removeItem('firebase-auth-token');
                            }

                            // Wait before retry
                            await new Promise(r => setTimeout(r, attempts * 1000));
                            continue;
                        }
                    }

                    throw new Error(errorData.error || `Failed to download document: ${response.status}`);
                } else {
                    const errorText = await response.text();
                    console.error('Error response body:', errorText);
                    throw new Error(`Failed to download document: ${response.status} - ${errorText.slice(0, 100)}`);
                }
            }

            // Try POST method with form data as a fallback in development mode
            if (process.env.NODE_ENV === 'development' && attempts === maxAttempts && !response.ok) {
                console.log('Attempting form-based download as fallback...');
                return await downloadWithFormData(documentId, original);
            }

            // Get the file blob and create a download link
            const blob = await response.blob();

            // Check if we got a valid file (not an HTML error page)
            if (blob.type.includes('text/html')) {
                console.error('Received HTML instead of file, likely an error page');
                const htmlText = await blob.text();
                console.error('HTML content preview:', htmlText.slice(0, 200));
                throw new Error('Received HTML error page instead of file');
            }

            const url = window.URL.createObjectURL(blob);

            // Create a hidden anchor element and trigger download
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            // Set filename from Content-Disposition header if available
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    a.download = filenameMatch[1];
                }
            } else {
                // Fallback filename
                a.download = original ? 'original-document' : 'redacted-document';
            }

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // If we got here, download succeeded
            return;

        } catch (error) {
            console.error(`Error in download attempt ${attempts}:`, error);

            // If we've reached max attempts, throw the error
            if (attempts >= maxAttempts) {
                throw error;
            }

            // Wait before retry (increasing delay)
            await new Promise(r => setTimeout(r, attempts * 1000));
        }
    }
};

/**
 * Fallback download method using form-based authentication
 * Used in development mode when regular download fails
 */
async function downloadWithFormData(documentId: string, original: boolean = false): Promise<void> {
    try {
        console.log('Attempting form-based download method...');
        const endpoint = original
            ? `/api/documents/${documentId}/download-original`
            : `/api/documents/${documentId}/download`;

        // Create a form to submit
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = endpoint;
        form.target = '_blank'; // Open in new tab to avoid page navigation

        // Add user ID from localStorage if available (for development)
        const userId = localStorage.getItem('firebase-user-id');
        if (userId) {
            const userIdInput = document.createElement('input');
            userIdInput.type = 'hidden';
            userIdInput.name = 'user_id';
            userIdInput.value = userId;
            form.appendChild(userIdInput);
        }

        // Submit the form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        console.log('Form-based download initiated');
    } catch (error) {
        console.error('Error in form-based download:', error);
        throw error;
    }
}

/**
 * Helper method to get the authentication token and any extra headers
 */
export const getAuthTokenAndHeaders = async (): Promise<{ token: string; headers: Record<string, string> }> => {
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