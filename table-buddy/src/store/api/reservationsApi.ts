import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Reservation {
  id: number;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  date: string;
  time: string;
  party_size: number;
  occasion: string;
  special_requests: string;
  status: string;
  table_id: number;
  table_name: string;
  table_section: string;
}

export interface ReservationFormData {
  customerName: string;
  phoneNumber: string;
  email?: string;
  numberOfGuests: number;
  tableId: string | null;
  date: string;
  time: string;
  occasion?: string;
  specialRequests?: string;
}

export const reservationsApi = createApi({
  reducerPath: 'reservationsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Reservations'],
  endpoints: (builder) => ({
    getReservations: builder.query<Reservation[], void>({
      query: () => 'reservations',
      providesTags: ['Reservations'],
    }),
    createReservation: builder.mutation<Reservation, ReservationFormData>({
      query: (reservation) => ({
        url: 'reservations',
        method: 'POST',
        body: reservation,
      }),
      invalidatesTags: ['Reservations'],
    }),
    updateReservation: builder.mutation<Reservation, Partial<Reservation>>({
      query: ({ id, ...patch }) => ({
        url: `reservations/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Reservations'],
    }),
    deleteReservation: builder.mutation<void, number>({
      query: (id) => ({
        url: `reservations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reservations'],
    }),
  }),
});

export const {
  useGetReservationsQuery,
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useDeleteReservationMutation,
} = reservationsApi; 