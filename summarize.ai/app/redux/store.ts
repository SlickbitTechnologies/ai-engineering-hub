import { configureStore } from '@reduxjs/toolkit';
import userReducer from './features/userSlice';
import summariesReducer from './features/summariesSlice';
import youtubeReducer from './features/youtubeSlice';
import quotaReducer from './features/quotaSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        summaries: summariesReducer,
        youtube: youtubeReducer,
        quota: quotaReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 