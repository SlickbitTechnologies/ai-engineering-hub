import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RedactionTemplate, RedactionEntity, RedactionReport } from '@/types/redaction';
import { redactionTemplates as defaultTemplates } from '@/config/redactionTemplates';
import { getAuthTokenAndHeaders } from '@/utils/fileServices';

export interface RedactionRule {
    id: string;
    name: string;
    pattern: string;
    description: string;
    type: 'name' | 'address' | 'phone' | 'email' | 'site' | 'investigator' | 'confidential' | 'custom';
    isActive: boolean;
    createdAt: string;
    isSystem: boolean;
}

export interface RedactionItem {
    id: string;
    documentId: string;
    pageNumber: number;
    text: string;
    reason: string;
    ruleId: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    isApproved: boolean;
    isRejected: boolean;
}

// Store redaction reports by document ID
export interface RedactionReportStore {
    [documentId: string]: RedactionReport;
}

// Async thunks for API calls
export const fetchUserTemplates = createAsyncThunk(
    'redaction/fetchUserTemplates',
    async (_, { rejectWithValue }) => {
        try {
            const { token, headers } = await getAuthTokenAndHeaders();

            const response = await fetch('/api/templates', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...headers
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const templates = await response.json();
            return templates;
        } catch (error) {
            console.error('Error fetching templates:', error);
            return rejectWithValue((error as Error).message);
        }
    }
);

export const createTemplate = createAsyncThunk(
    'redaction/createTemplate',
    async (template: Omit<RedactionTemplate, 'id'>, { rejectWithValue }) => {
        try {
            // Get authentication token
            const { token, headers } = await getAuthTokenAndHeaders();

            // Debug: check if we have a token
            if (!token) {
                console.error('Authentication token is missing');
                return rejectWithValue('Authentication token is missing');
            }

            console.log('Creating template with auth', { hasToken: !!token });

            // Make API request
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(template)
            });

            // Handle response status
            if (!response.ok) {
                // Try to get more detailed error
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData && typeof errorData === 'object') {
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    }
                } catch (e) {
                    // If we can't parse JSON, try to get text
                    try {
                        const errorText = await response.text();
                        if (errorText) errorMessage = errorText;
                    } catch {
                        // Fallback to original error if text reading fails
                    }
                }

                console.error('Error creating template:', errorMessage);
                return rejectWithValue(errorMessage);
            }

            const createdTemplate = await response.json();
            return createdTemplate;
        } catch (error) {
            console.error('Error creating template:', error);
            return rejectWithValue((error as Error).message);
        }
    }
);

export const updateTemplateAsync = createAsyncThunk(
    'redaction/updateTemplate',
    async (template: RedactionTemplate, { rejectWithValue }) => {
        try {
            const { token, headers } = await getAuthTokenAndHeaders();

            const response = await fetch(`/api/templates/${template.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(template)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const updatedTemplate = await response.json();
            return updatedTemplate;
        } catch (error) {
            console.error('Error updating template:', error);
            return rejectWithValue((error as Error).message);
        }
    }
);

export const deleteTemplateAsync = createAsyncThunk(
    'redaction/deleteTemplate',
    async (templateId: string, { rejectWithValue }) => {
        try {
            const { token, headers } = await getAuthTokenAndHeaders();

            const response = await fetch(`/api/templates/${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...headers
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return templateId;
        } catch (error) {
            console.error('Error deleting template:', error);
            return rejectWithValue((error as Error).message);
        }
    }
);

interface RedactionState {
    rules: RedactionRule[];
    items: RedactionItem[];
    templates: RedactionTemplate[];
    reports: RedactionReportStore;
    isProcessing: boolean;
    processingProgress: number;
    error: string | null;
    selectedRuleId: string | null;
    selectedTemplateId: string | null;
    isLoadingTemplates: boolean;
}

const initialState: RedactionState = {
    rules: [
        {
            id: '1',
            name: 'Personal Names',
            pattern: '\\b[A-Z][a-z]+ [A-Z][a-z]+\\b',
            description: 'Redacts personal names in the format "First Last"',
            type: 'name',
            isActive: true,
            createdAt: new Date().toISOString(),
            isSystem: true,
        },
        {
            id: '2',
            name: 'Email Addresses',
            pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
            description: 'Redacts email addresses',
            type: 'email',
            isActive: true,
            createdAt: new Date().toISOString(),
            isSystem: true,
        },
        {
            id: '3',
            name: 'Site Names',
            pattern: '\\bSite [0-9]+\\b',
            description: 'Redacts site identifiers',
            type: 'site',
            isActive: true,
            createdAt: new Date().toISOString(),
            isSystem: true,
        },
    ],
    items: [],
    templates: [],
    reports: {},
    isProcessing: false,
    processingProgress: 0,
    error: null,
    selectedRuleId: null,
    selectedTemplateId: null,
    isLoadingTemplates: false,
};

export const redactionSlice = createSlice({
    name: 'redaction',
    initialState,
    reducers: {
        startProcessing: (state) => {
            state.isProcessing = true;
            state.processingProgress = 0;
            state.error = null;
        },
        updateProgress: (state, action: PayloadAction<number>) => {
            state.processingProgress = action.payload;
        },
        processComplete: (state) => {
            state.isProcessing = false;
            state.processingProgress = 100;
        },
        processError: (state, action: PayloadAction<string>) => {
            state.isProcessing = false;
            state.error = action.payload;
        },
        addRule: (state, action: PayloadAction<Omit<RedactionRule, 'id' | 'createdAt' | 'isSystem'>>) => {
            const newRule: RedactionRule = {
                ...action.payload,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                isSystem: false,
            };
            state.rules.push(newRule);
        },
        updateRule: (state, action: PayloadAction<Partial<RedactionRule> & { id: string }>) => {
            const index = state.rules.findIndex(rule => rule.id === action.payload.id);
            if (index !== -1) {
                state.rules[index] = { ...state.rules[index], ...action.payload };
            }
        },
        toggleRuleActive: (state, action: PayloadAction<string>) => {
            const rule = state.rules.find(rule => rule.id === action.payload);
            if (rule) {
                rule.isActive = !rule.isActive;
            }
        },
        deleteRule: (state, action: PayloadAction<string>) => {
            state.rules = state.rules.filter(rule => rule.id !== action.payload || rule.isSystem);
        },
        addRedactionItems: (state, action: PayloadAction<RedactionItem[]>) => {
            state.items = [...state.items, ...action.payload];
        },
        approveRedactionItem: (state, action: PayloadAction<string>) => {
            const item = state.items.find(item => item.id === action.payload);
            if (item) {
                item.isApproved = true;
                item.isRejected = false;
            }
        },
        rejectRedactionItem: (state, action: PayloadAction<string>) => {
            const item = state.items.find(item => item.id === action.payload);
            if (item) {
                item.isRejected = true;
                item.isApproved = false;
            }
        },
        clearRedactionItems: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(item => item.documentId !== action.payload);
        },
        selectRule: (state, action: PayloadAction<string | null>) => {
            state.selectedRuleId = action.payload;
        },
        addTemplate: (state, action: PayloadAction<Omit<RedactionTemplate, 'id'>>) => {
            const newTemplate: RedactionTemplate = {
                ...action.payload,
                id: Date.now().toString(),
            };
            state.templates.push(newTemplate);
        },
        updateTemplate: (state, action: PayloadAction<Partial<RedactionTemplate> & { id: string }>) => {
            const index = state.templates.findIndex(template => template.id === action.payload.id);
            if (index !== -1) {
                state.templates[index] = { ...state.templates[index], ...action.payload };
            }
        },
        deleteTemplate: (state, action: PayloadAction<string>) => {
            state.templates = state.templates.filter(template => template.id !== action.payload);
        },
        selectTemplate: (state, action: PayloadAction<string | null>) => {
            state.selectedTemplateId = action.payload;
        },
        saveRedactionReport: (state, action: PayloadAction<{ documentId: string, report: RedactionReport }>) => {
            const { documentId, report } = action.payload;
            state.reports[documentId] = report;
        },
        clearRedactionReport: (state, action: PayloadAction<string>) => {
            delete state.reports[action.payload];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserTemplates.pending, (state) => {
                state.isLoadingTemplates = true;
                state.error = null;
            })
            .addCase(fetchUserTemplates.fulfilled, (state, action) => {
                state.isLoadingTemplates = false;
                if (action.payload && action.payload.length > 0) {
                    state.templates = action.payload;
                }
                else if (state.templates.length === 0) {
                    state.templates = defaultTemplates;
                }
            })
            .addCase(fetchUserTemplates.rejected, (state, action) => {
                state.isLoadingTemplates = false;
                state.error = action.payload as string || 'Failed to fetch templates';
                if (state.templates.length === 0) {
                    state.templates = defaultTemplates;
                }
            })
            .addCase(createTemplate.fulfilled, (state, action) => {
                state.templates.push(action.payload);
            })
            .addCase(updateTemplateAsync.fulfilled, (state, action) => {
                const index = state.templates.findIndex(template => template.id === action.payload.id);
                if (index !== -1) {
                    state.templates[index] = action.payload;
                }
            })
            .addCase(deleteTemplateAsync.fulfilled, (state, action) => {
                state.templates = state.templates.filter(template => template.id !== action.payload);
            });
    }
});

export const {
    startProcessing,
    updateProgress,
    processComplete,
    processError,
    addRule,
    updateRule,
    toggleRuleActive,
    deleteRule,
    addRedactionItems,
    approveRedactionItem,
    rejectRedactionItem,
    clearRedactionItems,
    selectRule,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate,
    saveRedactionReport,
    clearRedactionReport,
} = redactionSlice.actions;

export default redactionSlice.reducer; 