import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

const initialState: DocumentState = {
    documents: [],
    selectedDocument: null,
};

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
});

export const { addDocument, selectDocument, updateDocument, removeDocument } = documentSlice.actions;
export default documentSlice.reducer; 