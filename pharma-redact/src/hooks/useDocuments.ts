import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Document } from '@/types/document';

export function useDocuments() {
    const { user } = useAuth();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

    // Helper to get auth header
    const getAuthHeader = useCallback(async () => {
        if (!user) throw new Error('User not authenticated');

        return {
            Authorization: `Bearer ${await user.getIdToken()}`
        };
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
            setDocuments(data);
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
            const headers = await getAuthHeader();

            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch document');
            }

            const data = await response.json();
            setCurrentDocument(data);
            return data;
        } catch (err: any) {
            setError(err.message || 'Failed to fetch document');
            console.error('Error fetching document:', err);
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
            setDocuments(prevDocs => [data, ...prevDocs]);

            return data;
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
            const headers = await getAuthHeader();

            const formData = new FormData();
            formData.append('redactedFile', redactedFile);
            formData.append('summary', summary);

            const response = await fetch(`/api/documents/${documentId}/redact`, {
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
            setCurrentDocument(data);

            // Update the document in the documents list
            setDocuments(prevDocs =>
                prevDocs.map(doc => doc.id === documentId ? data : doc)
            );

            return data;
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
            const headers = await getAuthHeader();

            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete document');
            }

            // Remove from the documents list
            setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));

            // Clear current document if it's the one being deleted
            if (currentDocument?.id === documentId) {
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