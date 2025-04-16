import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../services/api';

// Mock response data (in a real app, this would come from the server)

// Types
export interface DashboardMetrics {
  totalCalls: number;
  averageDuration: string;
  kpiComplianceRate: number;
  complianceIssues: number;
  trends: {
    totalCalls: string;
    averageDuration: string;
    kpiComplianceRate: string;
    complianceIssues: string;
  };
}

export interface CallVolumeTrend {
  labels: string[];
  data: number[];
}

export interface KpiPerformance {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface SentimentTrend {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface RecentCall {
  id: string;
  date: string;
  agent: string;
  customer: string;
  duration: string;
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

// API Slice
export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: baseQuery,
  tagTypes: ['DashboardData'],
  endpoints: (builder) => ({
    // Get dashboard metrics
    getDashboardMetrics: builder.query<DashboardMetrics, void>({
      query: () => '/dashboard/metrics',
      providesTags: ['DashboardData'],
    }),

    // Get call volume trend
    getCallVolumeTrend: builder.query<CallVolumeTrend, string>({
      query: (timeframe = 'week') => ({
        url: '/dashboard/call-volume',
        params: { timeframe },
      }),
      providesTags: ['DashboardData'],
    }),

    // Get KPI performance
    getKpiPerformance: builder.query<KpiPerformance, string>({
      query: (timeframe = 'month') => ({
        url: '/dashboard/kpi-performance',
        params: { timeframe },
      }),
      providesTags: ['DashboardData'],
    }),

    // Get sentiment trend
    getSentimentTrend: builder.query<SentimentTrend, string>({
      query: (timeframe = 'month') => ({
        url: '/dashboard/sentiment-trend',
        params: { timeframe },
      }),
      providesTags: ['DashboardData'],
    }),

    // Get recent calls
    getRecentCalls: builder.query<RecentCall[], number>({
      query: (limit = 5) => ({
        url: '/dashboard/recent-calls',
        params: { limit },
      }),
      providesTags: ['DashboardData'],
    }),
  }),
});

// Export hooks
export const {
  useGetDashboardMetricsQuery,
  useGetCallVolumeTrendQuery,
  useGetKpiPerformanceQuery,
  useGetSentimentTrendQuery,
  useGetRecentCallsQuery,
} = dashboardApi; 