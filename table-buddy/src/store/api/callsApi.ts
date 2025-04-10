import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Call {
  id: string;
  timestamp: string;
  duration: number;
  status: 'completed' | 'missed' | 'in-progress';
  callerNumber: string;
  restaurantId: string;
}

export const callsApi = createApi({
  reducerPath: 'callsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Calls'],
  endpoints: (builder) => ({
    getCalls: builder.query<Call[], void>({
      query: () => 'calls',
      providesTags: ['Calls'],
    }),
    getCallById: builder.query<Call, string>({
      query: (id) => `calls/${id}`,
      providesTags: (result, error, id) => [{ type: 'Calls', id }],
    }),
    simulateCall: builder.mutation<Call, Partial<Call>>({
      query: (callData) => ({
        url: 'calls/simulate',
        method: 'POST',
        body: callData,
      }),
      invalidatesTags: ['Calls'],
    }),
  }),
});

export const { useGetCallsQuery, useGetCallByIdQuery, useSimulateCallMutation } = callsApi; 