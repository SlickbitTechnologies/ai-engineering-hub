import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
    getDocuments,
    uploadDocument,
    deleteDocument as deleteDocumentService,
    getDocumentById
} from '@/utils/fileServices';
import { Document as DocumentType } from '@/types/document';

// For compatibility with existing code
export interface Document {
    id: string;
    name: string;
    type: string;
    path: string;
    size: number;
    uploadedAt: string;
    status: 'pending' | 'processing' | 'redacted' | 'error';
    source: string;
    fileUrl?: string;
    redactedUrl?: string;
    entitiesFound?: number;
}

// Mapper to convert our SQLite Document to Redux Document
const mapDbDocToStoreDoc = (dbDoc: DocumentType): Document => {
    return {
        id: dbDoc.id,
        name: dbDoc.fileName,
        type: dbDoc.fileType.split('/').pop() || 'unknown',
        path: `/documents/${dbDoc.id}`,
        size: dbDoc.fileSize,
        uploadedAt: new Date(dbDoc.uploadedAt).toISOString(),
        status: dbDoc.status,
        source: 'upload',
        fileUrl: dbDoc.originalFilePath,
        redactedUrl: dbDoc.redactedFilePath || undefined
    };
};

interface DocumentsState {
    documents: Document[];
    selectedDocument: Document | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: DocumentsState = {
    documents: [],
    selectedDocument: null,
    isLoading: false,
    error: null,
};

// Async thunk for fetching documents from SQLite
export const fetchDocuments = createAsyncThunk(
    'documents/fetchDocuments',
    async (_, { rejectWithValue }) => {
        try {
            const documents = await getDocuments();
            return documents.map(mapDbDocToStoreDoc);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for adding a document to SQLite
export const addDocument = createAsyncThunk(
    'documents/addDocument',
    async (file: File, { rejectWithValue }) => {
        try {
            const dbDocument = await uploadDocument(file);
            return mapDbDocToStoreDoc(dbDocument);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for deleting a document
export const removeDocument = createAsyncThunk(
    'documents/removeDocument',
    async ({ id }: { id: string }, { rejectWithValue }) => {
        try {
            await deleteDocumentService(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for getting a document by ID
export const getDocument = createAsyncThunk(
    'documents/getDocument',
    async (id: string, { rejectWithValue }) => {
        try {
            const document = await getDocumentById(id);
            return mapDbDocToStoreDoc(document);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const documentsSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {
        selectDocument: (state, action: PayloadAction<string>) => {
            const documentId = action.payload;
            state.selectedDocument = state.documents.find(doc => doc.id === documentId) || null;
        },
        clearSelectedDocument: (state) => {
            state.selectedDocument = null;
        },
        updateDocumentStatus: (state, action: PayloadAction<{ id: string, status: Document['status'] }>) => {
            const { id, status } = action.payload;
            const documentIndex = state.documents.findIndex(doc => doc.id === id);

            if (documentIndex !== -1) {
                state.documents[documentIndex].status = status;

                if (state.selectedDocument && state.selectedDocument.id === id) {
                    state.selectedDocument.status = status;
                }
            }
        },
        updateDocumentProperties: (state, action: PayloadAction<{ id: string, properties: Partial<Document> }>) => {
            const { id, properties } = action.payload;
            const documentIndex = state.documents.findIndex(doc => doc.id === id);

            if (documentIndex !== -1) {
                state.documents[documentIndex] = { ...state.documents[documentIndex], ...properties };

                if (state.selectedDocument && state.selectedDocument.id === id) {
                    state.selectedDocument = { ...state.selectedDocument, ...properties };
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch documents cases
            .addCase(fetchDocuments.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchDocuments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.documents = action.payload;
            })
            .addCase(fetchDocuments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Add document cases
            .addCase(addDocument.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addDocument.fulfilled, (state, action) => {
                state.isLoading = false;
                state.documents.push(action.payload as Document);
            })
            .addCase(addDocument.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Remove document cases
            .addCase(removeDocument.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(removeDocument.fulfilled, (state, action) => {
                state.isLoading = false;
                state.documents = state.documents.filter(doc => doc.id !== action.payload);
                if (state.selectedDocument && state.selectedDocument.id === action.payload) {
                    state.selectedDocument = null;
                }
            })
            .addCase(removeDocument.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Get document by ID cases
            .addCase(getDocument.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getDocument.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedDocument = action.payload;

                // Update in documents list if it exists
                const index = state.documents.findIndex(doc => doc.id === action.payload.id);
                if (index !== -1) {
                    state.documents[index] = action.payload;
                } else {
                    // Add to documents list if not found
                    state.documents.push(action.payload);
                }
            })
            .addCase(getDocument.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    selectDocument,
    clearSelectedDocument,
    updateDocumentStatus,
    updateDocumentProperties
} = documentsSlice.actions;

export default documentsSlice.reducer; 