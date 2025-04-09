import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface RestaurantSettings {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export const restaurantApi = createApi({
  reducerPath: 'restaurantApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Restaurant'],
  endpoints: (builder) => ({
    getRestaurantSettings: builder.query<RestaurantSettings, void>({
      query: () => 'restaurant',
      providesTags: ['Restaurant'],
    }),
    updateRestaurantSettings: builder.mutation<RestaurantSettings, Partial<RestaurantSettings>>({
      query: (settings) => ({
        url: 'restaurant',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Restaurant'],
    }),
  }),
});

export const {
  useGetRestaurantSettingsQuery,
  useUpdateRestaurantSettingsMutation,
} = restaurantApi; 