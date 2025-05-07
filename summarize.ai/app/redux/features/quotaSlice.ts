import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/firebase';
import { RootState } from '../store';
import { authFetch } from '@/app/lib/authFetch';

interface QuotaState {
    used: number;
    limit: number;
    date: string;
    loading: boolean;
    error: string | null;
}

const initialState: QuotaState = {
    used: 0,
    limit: 10, // Default limit
    date: new Date().toISOString().slice(0, 10),
    loading: false,
    error: null,
};

// Fetch user quota from Firestore
export const fetchUserQuota = createAsyncThunk(
    'quota/fetchUserQuota',
    async (userId: string, { rejectWithValue }) => {
        try {
            if (!userId) {
                return rejectWithValue('User ID is required to fetch quota');
            }

            // Try to fetch from API first (for latest status) with authenticated request
            try {
                const response = await authFetch(`/api/quota-status?userId=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    return {
                        used: data.count || 0,
                        limit: data.limit || 10,
                        date: new Date().toISOString().slice(0, 10)
                    };
                } else {
                    console.warn('API response not ok:', await response.text());
                }
            } catch (error) {
                console.error('Error fetching quota from API:', error);
                // Continue with Firestore fallback
            }

            // Fallback to Firestore
            const userDoc = doc(db, `users/${userId}`);
            const userSnapshot = await getDoc(userDoc);

            if (!userSnapshot.exists()) {
                // If user doc doesn't exist, create it with initial quota
                const today = new Date().toISOString().slice(0, 10);
                const newQuota = { date: today, used: 0 };
                await setDoc(userDoc, { dailyQuota: newQuota }, { merge: true });
                return newQuota;
            }

            const userData = userSnapshot.data();
            const quota = userData.dailyQuota;

            // If quota exists but it's from a previous day, reset it
            if (quota && quota.date !== initialState.date) {
                const newQuota = { date: initialState.date, used: 0 };
                await updateDoc(userDoc, { dailyQuota: newQuota });
                return newQuota;
            }

            // Return existing quota or create new one
            return quota || { date: initialState.date, used: 0 };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch quota');
        }
    }
);

// Increment user quota in Firestore
export const incrementUserQuota = createAsyncThunk(
    'quota/incrementUserQuota',
    async (userId: string, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const { used, limit, date } = state.quota;

            // Check if quota would be exceeded
            if (used >= limit) {
                throw new Error('Daily quota exceeded');
            }

            const userDoc = doc(db, `users/${userId}`);
            const today = new Date().toISOString().slice(0, 10);

            // Reset if it's a new day
            if (date !== today) {
                const newQuota = { date: today, used: 1 };
                await setDoc(userDoc, { dailyQuota: newQuota }, { merge: true });
                return newQuota;
            } else {
                // Increment existing quota
                const newUsed = used + 1;
                await updateDoc(userDoc, { 'dailyQuota.used': newUsed });
                return { date, used: newUsed };
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to increment quota');
        }
    }
);

export const quotaSlice = createSlice({
    name: 'quota',
    initialState,
    reducers: {
        resetError: (state) => {
            state.error = null;
        },
        // Add a setQuota action to update state from API responses
        setQuota: (state, action: PayloadAction<{ used?: number; limit?: number }>) => {
            // Safe assignment with fallbacks
            state.used = action.payload.used ?? 0;  // Use nullish coalescing
            state.limit = action.payload.limit ?? 10; // Use nullish coalescing
            state.date = new Date().toISOString().slice(0, 10); // Always use today
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserQuota.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserQuota.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.used = action.payload.used;
                state.date = action.payload.date;
            })
            .addCase(fetchUserQuota.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(incrementUserQuota.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(incrementUserQuota.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.used = action.payload.used;
                state.date = action.payload.date;
            })
            .addCase(incrementUserQuota.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { resetError, setQuota } = quotaSlice.actions;

export default quotaSlice.reducer; 