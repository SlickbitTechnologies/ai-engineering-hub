import { v4 as uuidv4 } from 'uuid';

// Interface for document metadata
export interface DocumentMetadata {
    id: string;
    name: string;
    type: string;
    path: string;
    size: number;
    uploadedAt: number;
    status: 'pending' | 'processing' | 'redacted' | 'error';
    source: string;
    fileUrl: string;
    redactedUrl?: string;
    entitiesFound?: number;
}

// Storage keys
const DOCUMENTS_METADATA_KEY = 'pharma-redact-documents';
const FILE_STORAGE_PREFIX = 'pharma-redact-file-';
const REDACTED_FILE_STORAGE_PREFIX = 'pharma-redact-redacted-file-';

// Get all document metadata from local storage
export const getDocumentsFromLocalStorage = (): DocumentMetadata[] => {
    try {
        const documentsJson = localStorage.getItem(DOCUMENTS_METADATA_KEY);
        return documentsJson ? JSON.parse(documentsJson) : [];
    } catch (error) {
        console.error('Error getting documents from local storage:', error);
        return [];
    }
};

// Save documents metadata to local storage
const saveDocumentsMetadata = (documents: DocumentMetadata[]): void => {
    try {
        localStorage.setItem(DOCUMENTS_METADATA_KEY, JSON.stringify(documents));
    } catch (error) {
        console.error('Error saving documents to local storage:', error);
        throw error;
    }
};

// Upload file to local storage and return a URL-like path
export const uploadFileToLocalStorage = async (file: File, path: string = 'documents'): Promise<string> => {
    try {
        console.log(`Starting local storage for file: ${file.name}`);

        // Create a unique ID for the file
        const fileId = uuidv4();
        const storageKey = `${FILE_STORAGE_PREFIX}${fileId}`;

        // Read file content as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Store file as Base64 string
        const base64String = arrayBufferToBase64(arrayBuffer);
        localStorage.setItem(storageKey, base64String);

        // Create a URL-like identifier that can be used for reference
        const localUrl = `local://${path}/${fileId}/${encodeURIComponent(file.name)}`;
        console.log('File stored locally, reference:', localUrl);

        return localUrl;
    } catch (error) {
        console.error('Error in uploadFileToLocalStorage:', error);
        throw error;
    }
};

// Store a redacted file locally
export const storeRedactedFileLocally = async (
    documentId: string,
    redactedPdfBytes: Uint8Array,
    fileName: string
): Promise<string> => {
    try {
        const redactedFileId = uuidv4();
        const storageKey = `${REDACTED_FILE_STORAGE_PREFIX}${redactedFileId}`;

        // Store file as Base64 string
        const base64String = arrayBufferToBase64(redactedPdfBytes.buffer);
        localStorage.setItem(storageKey, base64String);

        // Create a URL-like identifier
        const localUrl = `local://redacted/${documentId}/${redactedFileId}/${encodeURIComponent(fileName)}`;
        console.log('Redacted file stored locally, reference:', localUrl);

        return localUrl;
    } catch (error) {
        console.error('Error storing redacted file locally:', error);
        throw error;
    }
};

// Add document metadata to local storage
export const addDocumentToLocalStorage = async (documentData: Omit<DocumentMetadata, 'id'>): Promise<string> => {
    try {
        const documents = getDocumentsFromLocalStorage();
        const id = uuidv4();

        const newDocument: DocumentMetadata = {
            ...documentData,
            id
        };

        documents.push(newDocument);
        saveDocumentsMetadata(documents);

        console.log('Document added with ID:', id);
        return id;
    } catch (error) {
        console.error('Error adding document to local storage:', error);
        throw error;
    }
};

// Delete document from local storage
export const deleteDocument = async (fileUrl: string, documentId: string): Promise<boolean> => {
    try {
        console.log(`Deleting document: ${documentId}, file URL: ${fileUrl}`);

        // Delete the file if it exists
        if (fileUrl && fileUrl.startsWith('local://')) {
            const fileId = extractFileIdFromLocalUrl(fileUrl);
            if (fileId) {
                localStorage.removeItem(`${FILE_STORAGE_PREFIX}${fileId}`);
                console.log('File deleted from local storage');
            }
        }

        // Delete the redacted file if it exists
        const documents = getDocumentsFromLocalStorage();
        const document = documents.find(doc => doc.id === documentId);

        if (document?.redactedUrl && document.redactedUrl.startsWith('local://')) {
            const redactedFileId = extractFileIdFromLocalUrl(document.redactedUrl);
            if (redactedFileId) {
                localStorage.removeItem(`${REDACTED_FILE_STORAGE_PREFIX}${redactedFileId}`);
                console.log('Redacted file deleted from local storage');
            }
        }

        // Remove from documents metadata
        const updatedDocuments = documents.filter(doc => doc.id !== documentId);
        saveDocumentsMetadata(updatedDocuments);
        console.log('Document metadata deleted from local storage');

        return true;
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
};

// Get file content as Blob from local storage
export const getFileFromLocalStorage = async (fileUrl: string): Promise<Blob | null> => {
    try {
        if (!fileUrl || !fileUrl.startsWith('local://')) {
            return null;
        }

        const fileId = extractFileIdFromLocalUrl(fileUrl);
        if (!fileId) {
            return null;
        }

        // Try to find the file in either regular or redacted storage
        let storageKey = `${FILE_STORAGE_PREFIX}${fileId}`;
        let fileData = localStorage.getItem(storageKey);

        if (!fileData) {
            // Try redacted storage
            storageKey = `${REDACTED_FILE_STORAGE_PREFIX}${fileId}`;
            fileData = localStorage.getItem(storageKey);
        }

        if (!fileData) {
            return null;
        }

        // Convert Base64 string back to Blob
        const arrayBuffer = base64ToArrayBuffer(fileData);
        return new Blob([arrayBuffer], { type: 'application/pdf' });
    } catch (error) {
        console.error('Error getting file from local storage:', error);
        return null;
    }
};

// Extract file ID from local URL
const extractFileIdFromLocalUrl = (localUrl: string): string | null => {
    try {
        // Format: local://path/fileId/filename
        const parts = localUrl.replace('local://', '').split('/');
        if (parts.length >= 2) {
            return parts[1]; // The fileId is the second part
        }
        return null;
    } catch (error) {
        console.error('Error extracting file ID from local URL:', error);
        return null;
    }
};

// Generate a local URL for viewing a file
export const getViewableUrl = async (fileUrl: string): Promise<string> => {
    if (!fileUrl.startsWith('local://')) {
        return fileUrl; // Return as-is if it's already a valid URL
    }

    const blob = await getFileFromLocalStorage(fileUrl);
    if (!blob) {
        throw new Error('File not found in local storage');
    }

    return URL.createObjectURL(blob);
};

// Helper function to convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer | ArrayBufferLike): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
};

// Helper function to convert Base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
};

// Function to sync documents from Redux store to local storage
export const syncDocumentsToLocalStorage = (documents: DocumentMetadata[]): void => {
    try {
        saveDocumentsMetadata(documents);
        console.log('Documents synchronized to local storage');
    } catch (error) {
        console.error('Error synchronizing documents to local storage:', error);
    }
}; 