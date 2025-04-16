import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../services/api';
import { KPIMetric } from '../types/kpi';

// Types matching the backend schemas
export interface ModelConfiguration {
  id: number;
  provider: string;
  model_name: string;
  api_key: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  system_prompt: string;
}

export interface AnalysisSettings {
  id: number;
  sentiment_analysis_enabled: boolean;
  keyword_extraction_enabled: boolean;
  topic_detection_enabled: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface CompleteConfiguration {
  ai_model_config: ModelConfiguration;
  analysis_settings: AnalysisSettings;
  users: User[];
}

// Create API
export const configurationApi = createApi({
  reducerPath: 'configurationApi',
  baseQuery: baseQuery,
  tagTypes: ['Configuration', 'Users', 'KPIMetrics'],
  endpoints: (builder) => ({
    // Get complete configuration
    getConfiguration: builder.query<CompleteConfiguration, void>({
      query: () => 'configuration',
      providesTags: ['Configuration', 'Users'],
    }),
    
    // Update model configuration
    updateModelConfiguration: builder.mutation<ModelConfiguration, Omit<ModelConfiguration, 'id'>>({
      query: (config) => ({
        url: 'configuration/model',
        method: 'PUT',
        body: config,
      }),
      invalidatesTags: ['Configuration'],
    }),
    
    // Update analysis settings
    updateAnalysisSettings: builder.mutation<AnalysisSettings, Omit<AnalysisSettings, 'id'>>({
      query: (settings) => ({
        url: 'configuration/analysis-settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Configuration'],
    }),
    
    // Get all users
    getUsers: builder.query<User[], void>({
      query: () => 'configuration/users',
      providesTags: ['Users'],
    }),
    
    // Create a new user
    createUser: builder.mutation<User, Omit<User, 'id'>>({
      query: (user) => ({
        url: 'configuration/users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['Users'],
    }),
    
    // Update a user
    updateUser: builder.mutation<User, { id: number; user: Omit<User, 'id'> }>({
      query: ({ id, user }) => ({
        url: `configuration/users/${id}`,
        method: 'PUT',
        body: user,
      }),
      invalidatesTags: ['Users'],
    }),
    
    // Delete a user
    deleteUser: builder.mutation<User, number>({
      query: (id) => ({
        url: `configuration/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),

    // KPI Metrics endpoints
    getKPIMetrics: builder.query<KPIMetric[], void>({
      query: () => 'configuration/kpi-metrics',
      providesTags: ['KPIMetrics']
    }),

    createKPIMetric: builder.mutation<KPIMetric, Omit<KPIMetric, 'id'>>({
      query: (metric) => ({
        url: 'configuration/kpi-metrics',
        method: 'POST',
        body: metric
      }),
      invalidatesTags: ['KPIMetrics']
    }),

    updateKPIMetric: builder.mutation<KPIMetric, KPIMetric>({
      query: (metric) => ({
        url: `configuration/kpi-metrics/${metric.id}`,
        method: 'PUT',
        body: metric
      }),
      invalidatesTags: ['KPIMetrics']
    }),

    deleteKPIMetric: builder.mutation<void, string>({
      query: (id) => ({
        url: `configuration/kpi-metrics/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['KPIMetrics']
    })
  }),
});

// Export hooks
export const {
  useGetConfigurationQuery,
  useUpdateModelConfigurationMutation,
  useUpdateAnalysisSettingsMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetKPIMetricsQuery,
  useCreateKPIMetricMutation,
  useUpdateKPIMetricMutation,
  useDeleteKPIMetricMutation
} = configurationApi; 