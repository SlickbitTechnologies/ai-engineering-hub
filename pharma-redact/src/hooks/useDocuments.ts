import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Document } from '@/types/document';

// Helper function to ensure all document properties have values
const normalizeDocument = (doc: any): Document => {
    const now = Date.now();
    return {
        id: doc.id || 'unknown-id',
        userId: doc.userId || localStorage.getItem('firebase-user-id') || 'unknown-user',
        originalFilePath: doc.originalFilePath || '',
        redactedFilePath: doc.redactedFilePath || null,
        summary: doc.summary || null,
        status: doc.status || 'pending',
        fileName: doc.fileName || 'Unnamed document',
        fileType: doc.fileType || 'application/octet-stream',
        fileSize: doc.fileSize || 0,
        uploadedAt: doc.uploadedAt || now,
        updatedAt: doc.updatedAt || now,
        fileStatus: doc.fileStatus || 'missing'
    };
};

export function useDocuments() {
    const { user } = useAuth();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

    // Helper to get auth header
    const getAuthHeader = useCallback(async () => {
        if (!user) throw new Error('User not authenticated');

        try {
            const token = await user.getIdToken();
            console.log('Auth token obtained, length:', token?.length);
            return {
                Authorization: `Bearer ${token}`
            };
        } catch (error) {
            console.error('Error getting auth token:', error);
            throw new Error('Failed to get authentication token');
        }
    }, [user]);

    // Fetch all documents for the logged-in user
    const fetchDocuments = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const headers = await getAuthHeader();

            const response = await fetch('/api/documents', {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch documents');
            }

            const data = await response.json();
            setDocuments(data.map(normalizeDocument));
        } catch (err: any) {
            setError(err.message || 'Failed to fetch documents');
            console.error('Error fetching documents:', err);
        } finally {
            setLoading(false);
        }
    }, [user, getAuthHeader]);

    // Fetch a single document by ID
    const fetchDocument = useCallback(async (documentId: string) => {
        if (!user) return null;

        setLoading(true);
        setError(null);

        try {
            // Ensure document ID is properly formatted
            const sanitizedId = String(documentId).trim();
            console.log(`Fetching document ${sanitizedId} (length: ${sanitizedId.length})...`);

            // Get auth headers with token
            const headers = await getAuthHeader();

            // Log token info for debugging
            try {
                const authHeader = headers.Authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
                    console.log(`Token obtained (${token.length} chars): ${token.substring(0, 10)}...${token.substring(token.length - 10)}`);

                    // Check token format - should be three parts separated by dots (header.payload.signature)
                    const tokenParts = token.split('.');
                    if (tokenParts.length !== 3) {
                        console.error('Invalid token format - should be in JWT format with 3 parts');
                    } else {
                        console.log('Token format valid (3 parts)');
                        try {
                            // Try to decode payload (middle part) to see user info
                            const payload = JSON.parse(atob(tokenParts[1]));
                            console.log('Token payload user info:', {
                                uid: payload.user_id || payload.sub,
                                email: payload.email,
                                exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown',
                                iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'unknown'
                            });
                        } catch (e) {
                            console.error('Error decoding token payload:', e);
                        }
                    }
                }
            } catch (tokenDebugError) {
                console.error('Error debugging token:', tokenDebugError);
            }

            console.log('Request headers:', {
                Authorization: headers.Authorization ?
                    `Bearer ${headers.Authorization.substring(7, 17)}...` : 'undefined'
            });

            // Make API request with sanitized ID
            const response = await fetch(`/api/documents/${sanitizedId}`, {
                method: 'GET',
                headers
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Non-JSON response:', await response.text());
                throw new Error('Server returned non-JSON response. Please check server logs.');
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API returned error:', errorData);
                if (response.status === 404) {
                    throw new Error(`Document not found: ${errorData.details?.checkedId || sanitizedId}. The document may have been deleted or you may not have permission to access it.`);
                } else {
                    throw new Error(errorData.error || `Failed to fetch document: ${response.status}`);
                }
            }

            const data = await response.json();

            // Enhanced debugging for document data
            console.log('API Response Data (raw):', data);
            console.log('Document Object Properties (raw):', Object.keys(data));

            // Check for undefined properties in raw data
            const undefinedProps = Object.entries(data)
                .filter(([_, value]) => value === undefined)
                .map(([key]) => key);
            if (undefinedProps.length > 0) {
                console.warn('Document has undefined properties:', undefinedProps);
            }

            const normalizedData = normalizeDocument(data);
            console.log('Normalized Document Data:', normalizedData);

            setCurrentDocument(normalizedData);
            return normalizedData;
        } catch (err: any) {
            console.error('Error fetching document:', err);

            // Handle fetch errors differently for better error messages
            if (err.name === 'SyntaxError' && err.message.includes('Unexpected token')) {
                setError('Server returned an invalid response. Please check server logs.');
            } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
                setError('Network error: Could not connect to server');
            } else {
                setError(err.message || 'Failed to fetch document');
            }

            return null;
        } finally {
            setLoading(false);
        }
    }, [user, getAuthHeader]);

    // Upload a new document
    const uploadDocument = useCallback(async (file: File) => {
        if (!user) return null;

        setLoading(true);
        setError(null);

        try {
            const headers = await getAuthHeader();

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/documents', {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload document');
            }

            const data = await response.json();

            // Update the documents list
            setDocuments(prevDocs => [normalizeDocument(data), ...prevDocs]);

            return normalizeDocument(data);
        } catch (err: any) {
            setError(err.message || 'Failed to upload document');
            console.error('Error uploading document:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user, getAuthHeader]);

    // Save a redacted document
    const saveRedactedDocument = useCallback(async (
        documentId: string,
        redactedFile: File,
        summary: string
    ) => {
        if (!user) return null;

        setLoading(true);
        setError(null);

        try {
            // Ensure document ID is properly formatted
            const sanitizedId = String(documentId).trim();
            console.log(`Saving redacted document ${sanitizedId}...`);

            const headers = await getAuthHeader();

            const formData = new FormData();
            formData.append('redactedFile', redactedFile);
            formData.append('summary', summary);

            const response = await fetch(`/api/documents/${sanitizedId}/redact`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save redacted document');
            }

            const data = await response.json();

            // Update current document
            setCurrentDocument(normalizeDocument(data));

            // Update the document in the documents list
            setDocuments(prevDocs =>
                prevDocs.map(doc => doc.id === sanitizedId ? normalizeDocument(data) : doc)
            );

            return normalizeDocument(data);
        } catch (err: any) {
            setError(err.message || 'Failed to save redacted document');
            console.error('Error saving redacted document:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user, getAuthHeader]);

    // Delete a document
    const deleteDocument = useCallback(async (documentId: string) => {
        if (!user) return false;

        setLoading(true);
        setError(null);

        try {
            // Ensure document ID is properly formatted
            const sanitizedId = String(documentId).trim();
            console.log(`Deleting document ${sanitizedId}...`);

            const headers = await getAuthHeader();

            const response = await fetch(`/api/documents/${sanitizedId}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete document');
            }

            // Remove from the documents list
            setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== sanitizedId));

            // Clear current document if it's the one being deleted
            if (currentDocument?.id === sanitizedId) {
                setCurrentDocument(null);
            }

            return true;
        } catch (err: any) {
            setError(err.message || 'Failed to delete document');
            console.error('Error deleting document:', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, getAuthHeader, currentDocument]);

    return {
        documents,
        currentDocument,
        loading,
        error,
        fetchDocuments,
        fetchDocument,
        uploadDocument,
        saveRedactedDocument,
        deleteDocument
    };
}