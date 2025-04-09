import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    isAuthenticated: boolean;
    email: string | null;
    displayName: string | null;
    dailySummaryCount: number;
    dailySummaryLimit: number;
}

const initialState: UserState = {
    isAuthenticated: false,
    email: null,
    displayName: null,
    dailySummaryCount: 0,
    dailySummaryLimit: 5, // Free tier limit
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state: UserState, action: PayloadAction<{ email: string; displayName: string }>) => {
            state.isAuthenticated = true;
            state.email = action.payload.email;
            state.displayName = action.payload.displayName;
        },
        incrementSummaryCount: (state: UserState) => {
            state.dailySummaryCount += 1;
        },
        resetSummaryCount: (state: UserState) => {
            state.dailySummaryCount = 0;
        },
        signOut: (state: UserState) => {
            state.isAuthenticated = false;
            state.email = null;
            state.displayName = null;
        },
    },
});

export const { setUser, incrementSummaryCount, resetSummaryCount, signOut } = userSlice.actions;

export default userSlice.reducer; 