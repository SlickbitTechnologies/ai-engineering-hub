import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Summary {
    id: string;
    userId: string;
    title: string;
    content: string;
    sourceType: 'web' | 'pdf' | 'audio' | 'text' | 'translation';
    sourceUrl?: string;
    createdAt: number;
}

interface SummariesState {
    items: Summary[];
    loading: boolean;
    error: string | null;
}

const initialState: SummariesState = {
    items: [],
    loading: false,
    error: null,
};

export const summariesSlice = createSlice({
    name: 'summaries',
    initialState,
    reducers: {
        addSummary: (state: SummariesState, action: PayloadAction<Summary>) => {
            state.items.unshift(action.payload);
        },
        setSummaries: (state: SummariesState, action: PayloadAction<Summary[]>) => {
            state.items = action.payload;
        },
        deleteSummary: (state: SummariesState, action: PayloadAction<string>) => {
            state.items = state.items.filter((summary: Summary) => summary.id !== action.payload);
        },
        setLoading: (state: SummariesState, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state: SummariesState, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const {
    addSummary,
    setSummaries,
    deleteSummary,
    setLoading,
    setError
} = summariesSlice.actions;

export default summariesSlice.reducer; 