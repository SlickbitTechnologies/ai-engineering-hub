import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Table {
  id: number;
  name: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  attributes?: string;
}

export const tablesApi = createApi({
  reducerPath: 'tablesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Tables'],
  endpoints: (builder) => ({
    getTables: builder.query<Table[], void>({
      query: () => 'tables',
      providesTags: ['Tables'],
    }),
    createTable: builder.mutation<Table, Partial<Table>>({
      query: (table) => ({
        url: 'tables',
        method: 'POST',
        body: table,
      }),
      invalidatesTags: ['Tables'],
    }),
    updateTable: builder.mutation<Table, Partial<Table>>({
      query: ({ id, ...patch }) => ({
        url: `tables/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Tables'],
    }),
    deleteTable: builder.mutation<void, number>({
      query: (id) => ({
        url: `tables/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tables'],
    }),
  }),
});

export const {
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
} = tablesApi; 