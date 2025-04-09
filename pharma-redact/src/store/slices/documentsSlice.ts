import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Document {
    id: string;
    name: string;
    type: 'pdf' | 'docx';
    path: string;
    size: number;
    uploadedAt: string;
    status: 'pending' | 'processing' | 'redacted' | 'error';
    source: 'upload' | 'dms' | 'sharepoint' | 'sample';
    appliedTemplateId?: string;
}

interface DocumentsState {
    documents: Document[];
    isLoading: boolean;
    error: string | null;
    selectedDocumentId: string | null;
}

const initialState: DocumentsState = {
    documents: [
        {
            id: '1',
            name: 'Clinical_Trial_Report_A123.pdf',
            type: 'pdf',
            path: '/documents/sample-1.pdf',
            size: 1548576,
            uploadedAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'redacted',
            source: 'sample',
            appliedTemplateId: '2'
        },
        {
            id: '2',
            name: 'Patient_Data_Summary.docx',
            type: 'docx',
            path: '/documents/sample-2.docx',
            size: 892400,
            uploadedAt: new Date(Date.now() - 172800000).toISOString(),
            status: 'pending',
            source: 'upload'
        },
        {
            id: '3',
            name: 'Research_Protocol_2023.pdf',
            type: 'pdf',
            path: '/documents/sample-3.pdf',
            size: 2145728,
            uploadedAt: new Date(Date.now() - 259200000).toISOString(),
            status: 'processing',
            source: 'dms'
        }
    ],
    isLoading: false,
    error: null,
    selectedDocumentId: null,
};

export const documentsSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {
        fetchDocumentsStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        fetchDocumentsSuccess: (state, action: PayloadAction<Document[]>) => {
            state.isLoading = false;
            state.documents = action.payload;
        },
        fetchDocumentsFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false;
            state.error = action.payload;
        },
        addDocument: (state, action: PayloadAction<Document>) => {
            state.documents.push(action.payload);
        },
        updateDocumentStatus: (state, action: PayloadAction<{ id: string; status: Document['status'] }>) => {
            const { id, status } = action.payload;
            const document = state.documents.find(doc => doc.id === id);
            if (document) {
                document.status = status;
            }
        },
        applyTemplate: (state, action: PayloadAction<{ documentId: string, templateId: string }>) => {
            const { documentId, templateId } = action.payload;
            const document = state.documents.find(doc => doc.id === documentId);
            if (document) {
                document.appliedTemplateId = templateId;
            }
        },
        removeDocument: (state, action: PayloadAction<string>) => {
            state.documents = state.documents.filter(doc => doc.id !== action.payload);
        },
        selectDocument: (state, action: PayloadAction<string | null>) => {
            state.selectedDocumentId = action.payload;
        },
    },
});

export const {
    fetchDocumentsStart,
    fetchDocumentsSuccess,
    fetchDocumentsFailure,
    addDocument,
    updateDocumentStatus,
    applyTemplate,
    removeDocument,
    selectDocument,
} = documentsSlice.actions;

export default documentsSlice.reducer; 