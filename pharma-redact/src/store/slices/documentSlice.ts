import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getDocuments, uploadDocument, deleteDocument as deleteServerDocument } from '@/utils/fileServices';
import { Document as DocumentType } from '@/types/document';

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
    entitiesFound?: number;
}

// Mapper to convert SQLite Document to Redux Document format
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

// Async thunk to load documents from SQLite database
export const loadDocuments = createAsyncThunk(
    'documents/loadDocuments',
    async (_, { rejectWithValue }) => {
        try {
            // Load documents from SQLite API
            const documents = await getDocuments();
            return documents.map(mapDbDocToStoreDoc);
        } catch (error: any) {
            console.error('Error loading documents:', error);
            return rejectWithValue(error.message);
        }
    }
);

const documentSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {
        addDocument: (state, action: PayloadAction<Document>) => {
            state.documents.push(action.payload);
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
            }
        },
        removeDocument: (state, action: PayloadAction<{ id: string }>) => {
            state.documents = state.documents.filter(doc => doc.id !== action.payload.id);
            if (state.selectedDocument?.id === action.payload.id) {
                state.selectedDocument = null;
            }
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
                state.error = action.payload as string || 'Failed to load documents';
            });
    },
});

export const { addDocument, selectDocument, updateDocument, removeDocument } = documentSlice.actions;
export default documentSlice.reducer; 