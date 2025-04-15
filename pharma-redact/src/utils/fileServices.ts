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
    const formData = new FormData();
    formData.append('file', file);

    const token = await getAuthToken();

    const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload document');
    }

    return await response.json();
};

/**
 * Get all documents for the current user
 * @returns List of document objects
 */
export const getDocuments = async (): Promise<Document[]> => {
    const token = await getAuthToken();

    const response = await fetch('/api/documents', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
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
    const token = await getAuthToken();

    const response = await fetch(`/api/documents/${documentId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
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
 * @param documentId The document ID
 * @param redactedFile The redacted file 
 * @param summary A summary of redactions
 * @returns The updated document
 */
export const saveRedactedDocument = async (
    documentId: string,
    redactedFile: File,
    summary: string
): Promise<Document> => {
    const token = await getAuthToken();

    const formData = new FormData();
    formData.append('redactedFile', redactedFile);
    formData.append('summary', summary);

    const response = await fetch(`/api/documents/${documentId}/redact`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
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
    const token = await getAuthToken();

    const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
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
 * Helper method to get the authentication token
 */
const getAuthToken = async (): Promise<string> => {
    // Get the current Firebase user
    const user = (window as any).firebase?.auth()?.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }

    // Get the user token
    return await user.getIdToken();
}; 