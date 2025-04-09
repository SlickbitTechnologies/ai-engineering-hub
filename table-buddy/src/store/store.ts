import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { tablesApi } from './api/tablesApi';
import { reservationsApi } from './api/reservationsApi';
import { restaurantApi } from './api/restaurantApi';
import { settingsApi } from './api/settingsApi';

export const store = configureStore({
  reducer: {
    [tablesApi.reducerPath]: tablesApi.reducer,
    [reservationsApi.reducerPath]: reservationsApi.reducer,
    [restaurantApi.reducerPath]: restaurantApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      tablesApi.middleware,
      reservationsApi.middleware,
      restaurantApi.middleware,
      settingsApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 