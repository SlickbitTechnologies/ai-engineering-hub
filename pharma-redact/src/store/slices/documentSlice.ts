import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getDocumentsFromLocalStorage, syncDocumentsToLocalStorage } from '@/utils/localStorage';

export interface Document {
    id: string;
    name: string;
    type: string;
    path: string;
    size: number;
    uploadedAt: string;
    status: 'pending' | 'processing' | 'redacted' | 'error';
    source: string;
    redactedUrl?: string;
    fileUrl?: string;
    firestoreId?: string;
}

interface DocumentState {
    documents: Document[];
    selectedDocument: Document | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: DocumentState = {
    documents: [],
    selectedDocument: null,
    isLoading: false,
    error: null
};

// Async thunk to load documents from local storage
export const loadDocuments = createAsyncThunk(
    'documents/loadDocuments',
    async () => {
        try {
            // Load documents from local storage
            const documents = getDocumentsFromLocalStorage();
            return documents;
        } catch (error) {
            console.error('Error loading documents from local storage:', error);
            throw error;
        }
    }
);

const documentSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {
        addDocument: (state, action: PayloadAction<Document>) => {
            state.documents.push(action.payload);
            // Sync to local storage after adding
            syncDocumentsToLocalStorage(state.documents);
        },
        selectDocument: (state, action: PayloadAction<string>) => {
            state.selectedDocument = state.documents.find(doc => doc.id === action.payload) || null;
        },
        updateDocument: (state, action: PayloadAction<{ id: string; updates: Partial<Document> }>) => {
            const index = state.documents.findIndex(doc => doc.id === action.payload.id);
            if (index !== -1) {
                state.documents[index] = { ...state.documents[index], ...action.payload.updates };
                if (state.selectedDocument?.id === action.payload.id) {
                    state.selectedDocument = { ...state.selectedDocument, ...action.payload.updates };
                }
                // Sync to local storage after updating
                syncDocumentsToLocalStorage(state.documents);
            }
        },
        removeDocument: (state, action: PayloadAction<{ id: string }>) => {
            state.documents = state.documents.filter(doc => doc.id !== action.payload.id);
            if (state.selectedDocument?.id === action.payload.id) {
                state.selectedDocument = null;
            }
            // Sync to local storage after removing
            syncDocumentsToLocalStorage(state.documents);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadDocuments.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadDocuments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.documents = action.payload;
            })
            .addCase(loadDocuments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to load documents';
            });
    },
});

export const { addDocument, selectDocument, updateDocument, removeDocument } = documentSlice.actions;
export default documentSlice.reducer; 