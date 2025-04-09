import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

export interface RedactionTemplate {
    id: string;
    name: string;
    description: string;
    ruleIds: string[];
    createdAt: string;
    updatedAt: string;
}

interface RedactionState {
    rules: RedactionRule[];
    items: RedactionItem[];
    templates: RedactionTemplate[];
    isProcessing: boolean;
    processingProgress: number;
    error: string | null;
    selectedRuleId: string | null;
    selectedTemplateId: string | null;
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
    templates: [
        {
            id: '1',
            name: 'Standard Redaction',
            description: 'Basic redaction for common personal information',
            ruleIds: ['1', '2'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: '2',
            name: 'Clinical Trial Redaction',
            description: 'Comprehensive redaction for clinical trial documents',
            ruleIds: ['1', '2', '3'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ],
    items: [],
    isProcessing: false,
    processingProgress: 0,
    error: null,
    selectedRuleId: null,
    selectedTemplateId: null,
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
        // Template actions
        addTemplate: (state, action: PayloadAction<Omit<RedactionTemplate, 'id' | 'createdAt' | 'updatedAt'>>) => {
            const newTemplate: RedactionTemplate = {
                ...action.payload,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            state.templates.push(newTemplate);
        },
        updateTemplate: (state, action: PayloadAction<Partial<RedactionTemplate> & { id: string }>) => {
            const index = state.templates.findIndex(template => template.id === action.payload.id);
            if (index !== -1) {
                state.templates[index] = {
                    ...state.templates[index],
                    ...action.payload,
                    updatedAt: new Date().toISOString()
                };
            }
        },
        deleteTemplate: (state, action: PayloadAction<string>) => {
            state.templates = state.templates.filter(template => template.id !== action.payload);
        },
        selectTemplate: (state, action: PayloadAction<string | null>) => {
            state.selectedTemplateId = action.payload;
        },
    },
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
    // Template actions
    addTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate,
} = redactionSlice.actions;

export default redactionSlice.reducer; 