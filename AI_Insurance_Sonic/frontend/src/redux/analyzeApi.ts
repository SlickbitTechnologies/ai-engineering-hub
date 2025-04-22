import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../services/api';

// Types matching the backend schemas
export interface BatchStatus {
  pending: 'pending';
  processing: 'processing';
  completed: 'completed';
  failed: 'failed';
}

export interface AudioFile {
  id: number;
  filename: string;
  original_filename: string;
  content_type: string;
  size: number;
  file_url: string;
  uploaded_at: string;
  processed: number;
}

export interface Batch {
  id: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_audio_files: number;
  completed_files: number;
  createdAt: string;
  updatedAt: string;
  audio_files?: AudioFile[];
}

export interface BatchCreateRequest {
  name: string;
}

// Create API slice
export const analyzeApi = createApi({
  reducerPath: 'analyzeApi',
  baseQuery,
  tagTypes: ['Batches', 'AudioFiles'],
  endpoints: (builder) => ({
    // Test endpoint to verify API connectivity
    testAnalyzeApi: builder.query<{ message: string }, void>({
      query: () => 'analyze/test',
    }),
    
    // Create a new batch
    createBatch: builder.mutation<Batch, BatchCreateRequest>({
      query: (data) => ({
        url: 'analyze/batches',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Batches'],
    }),
    
    // Get all batches
    getBatches: builder.query<Batch[], void>({
      query: () => 'analyze/batches',
      providesTags: ['Batches'],
    }),
    
    // Get a specific batch
    getBatch: builder.query<Batch, number>({
      query: (id) => `analyze/batches/${id}`,
      providesTags: (_, __, id) => [{ type: 'Batches', id }],
    }),
    
    // Upload files to a batch
    uploadFiles: builder.mutation<AudioFile[], { batchId: string, files: FormData }>({
      query: ({ batchId, files }) => ({
        url: `analyze/batches/${batchId}/upload`,
        method: 'POST',
        body: files,
      }),
      invalidatesTags: (_, __, { batchId }) => [
        { type: 'Batches', id: batchId },
        'Batches',
      ],
    }),
    
    // Update batch status
    updateBatchStatus: builder.mutation<Batch, { batchId: number, status: 'pending' | 'processing' | 'completed' | 'failed' }>({
      query: ({ batchId, status }) => ({
        url: `analyze/batches/${batchId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (_, __, { batchId }) => [
        { type: 'Batches', id: batchId },
        'Batches',
      ],
    }),
  }),
});

// Export hooks
export const {
  useTestAnalyzeApiQuery,
  useCreateBatchMutation,
  useGetBatchesQuery,
  useGetBatchQuery,
  useUploadFilesMutation,
  useUpdateBatchStatusMutation,
} = analyzeApi; 