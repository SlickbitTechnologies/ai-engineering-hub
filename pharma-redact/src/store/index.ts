import { configureStore } from '@reduxjs/toolkit';
import documentsReducer from '@/store/slices/documentsSlice';
import redactionReducer from '@/store/slices/redactionSlice';

export const store = configureStore({
    reducer: {
        documents: documentsReducer,
        redaction: redactionReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 