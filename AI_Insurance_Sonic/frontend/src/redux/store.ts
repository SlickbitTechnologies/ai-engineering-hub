import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { analyzeApi } from './analyzeApi';
import { configurationApi } from './configurationApi';
import { dashboardApi } from './dashboardApi';
import { callsApi } from './callsApi';
import dashboardReducer from './dashboardSlice';

// Log middleware setup for debugging
console.log('Setting up Redux store with APIs:');
console.log('- Dashboard API:', dashboardApi.reducerPath);
console.log('- Configuration API:', configurationApi.reducerPath); 
console.log('- Analyze API:', analyzeApi.reducerPath);
console.log('- Calls API:', callsApi.reducerPath);

export const store = configureStore({
  reducer: {
    [analyzeApi.reducerPath]: analyzeApi.reducer,
    [configurationApi.reducerPath]: configurationApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [callsApi.reducerPath]: callsApi.reducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      analyzeApi.middleware,
      configurationApi.middleware,
      dashboardApi.middleware,
      callsApi.middleware
    ),
});

// Enable refetchOnFocus and refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 