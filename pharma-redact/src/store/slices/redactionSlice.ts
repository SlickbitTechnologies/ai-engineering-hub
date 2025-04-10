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

export interface RedactionTemplate {
    id: string;
    name: string;
    description: string;
    ruleIds: string[];
    createdAt: string;
    isDefault: boolean;
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

interface RedactionState {
    rules: RedactionRule[];
    templates: RedactionTemplate[];
    items: RedactionItem[];
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
            description: 'Redacts personal names, emails, and site identifiers',
            ruleIds: ['1', '2', '3'],
            createdAt: new Date().toISOString(),
            isDefault: true,
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
        // Template reducers
        addTemplate: (state, action: PayloadAction<Omit<RedactionTemplate, 'id' | 'createdAt'>>) => {
            const newTemplate: RedactionTemplate = {
                ...action.payload,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
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
            // Don't delete if it's the only template or if it's the default
            const isDefault = state.templates.find(t => t.id === action.payload)?.isDefault;
            if (state.templates.length > 1 && !isDefault) {
                state.templates = state.templates.filter(template => template.id !== action.payload);
            }
        },
        setDefaultTemplate: (state, action: PayloadAction<string>) => {
            state.templates.forEach(template => {
                template.isDefault = template.id === action.payload;
            });
        },
        selectTemplate: (state, action: PayloadAction<string | null>) => {
            state.selectedTemplateId = action.payload;
        },
        addRuleToTemplate: (state, action: PayloadAction<{ templateId: string, ruleId: string }>) => {
            const template = state.templates.find(t => t.id === action.payload.templateId);
            if (template && !template.ruleIds.includes(action.payload.ruleId)) {
                template.ruleIds.push(action.payload.ruleId);
            }
        },
        removeRuleFromTemplate: (state, action: PayloadAction<{ templateId: string, ruleId: string }>) => {
            const template = state.templates.find(t => t.id === action.payload.templateId);
            if (template) {
                template.ruleIds = template.ruleIds.filter(id => id !== action.payload.ruleId);
            }
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
    setDefaultTemplate,
    selectTemplate,
    addRuleToTemplate,
    removeRuleFromTemplate,
} = redactionSlice.actions;

export default redactionSlice.reducer; 