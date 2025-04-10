import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface OperatingHours {
  id: number;
  day: string;
  lunch_opening_time: string;
  lunch_closing_time: string;
  dinner_opening_time: string;
  dinner_closing_time: string;
  created_at: string;
  updated_at: string;
}

export interface TableSettings {
  id: number;
  turnaround_time: number;
  created_at: string;
  updated_at: string;
}

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['OperatingHours', 'TableSettings'],
  endpoints: (builder) => ({
    // Operating Hours
    getOperatingHours: builder.query<OperatingHours[], void>({
      query: () => 'operating-hours',
      providesTags: ['OperatingHours'],
    }),
    updateOperatingHours: builder.mutation<OperatingHours[], Partial<OperatingHours>[]>({
      query: (hours) => ({
        url: 'operating-hours',
        method: 'PUT',
        body: hours,
      }),
      invalidatesTags: ['OperatingHours'],
    }),

    // Table Settings
    getTableSettings: builder.query<TableSettings, void>({
      query: () => 'table-settings',
      providesTags: ['TableSettings'],
    }),
    updateTableSettings: builder.mutation<TableSettings, Partial<TableSettings>>({
      query: (settings) => ({
        url: 'table-settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['TableSettings'],
    }),
  }),
});

export const {
  useGetOperatingHoursQuery,
  useUpdateOperatingHoursMutation,
  useGetTableSettingsQuery,
  useUpdateTableSettingsMutation,
} = settingsApi; 