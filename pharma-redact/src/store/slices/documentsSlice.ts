import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getDocumentsFromFirestore, addDocumentToFirestore, deleteDocument } from '@/utils/firebase';

export interface Document {
    id: string;
    name: string;
    type: string;
    path: string;
    size: number;
    uploadedAt: string;
    status: 'pending' | 'processing' | 'redacted' | 'error';
    source: string;
    fileUrl?: string; // URL to Firebase Storage file
    firestoreId?: string; // Firestore document ID
    redactedUrl?: string; // URL to redacted version of the document
}

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

// Async thunk for fetching documents from Firestore
export const fetchDocuments = createAsyncThunk(
    'documents/fetchDocuments',
    async (_, { rejectWithValue }) => {
        try {
            const documents = await getDocumentsFromFirestore();
            return documents;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for adding a document to Firestore
export const addDocument = createAsyncThunk(
    'documents/addDocument',
    async (document: Omit<Document, 'id' | 'firestoreId'>, { rejectWithValue }) => {
        try {
            const firestoreId = await addDocumentToFirestore(document);
            return { ...document, firestoreId, id: firestoreId };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for deleting a document
export const removeDocument = createAsyncThunk(
    'documents/removeDocument',
    async ({ id, fileUrl, firestoreId }: { id: string, fileUrl?: string, firestoreId?: string }, { rejectWithValue }) => {
        try {
            if (fileUrl && firestoreId) {
                await deleteDocument(fileUrl, firestoreId);
            }
            return id;
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
        },
        addLocalDocument: (state, action: PayloadAction<Document>) => {
            state.documents.push(action.payload);
        },
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
            });
    },
});

export const { selectDocument, clearSelectedDocument, updateDocumentStatus, updateDocumentProperties, addLocalDocument } = documentsSlice.actions;

export default documentsSlice.reducer; 