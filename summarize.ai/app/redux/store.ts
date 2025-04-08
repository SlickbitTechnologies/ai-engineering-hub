import { configureStore } from '@reduxjs/toolkit';
import userReducer from './features/userSlice';
import summariesReducer from './features/summariesSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        summaries: summariesReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 