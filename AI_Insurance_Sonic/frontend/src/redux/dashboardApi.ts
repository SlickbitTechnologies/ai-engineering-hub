import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../services/api';
import { DashboardState } from './dashboardSlice';

// Mock response data (in a real app, this would come from the server)
const mockDashboardData: DashboardState = {
  metrics: {
    totalCalls: {
      title: 'Total Calls Analyzed',
      value: '1,287',
      trend: {
        value: '+12%',
        direction: 'up',
        description: 'Last 30 days'
      },
      icon: '📊'
    },
    averageCallDuration: {
      title: 'Average Call Duration',
      value: '8:24',
      trend: {
        value: '-8%',
        direction: 'down',
        description: '2:12 less than previous period'
      },
      icon: '⏱️'
    },
    kpiComplianceRate: {
      title: 'KPI Compliance Rate',
      value: '87%',
      trend: {
        value: '+3%',
        direction: 'up',
        description: '3% improvement'
      },
      icon: '📈'
    },
    complianceIssues: {
      title: 'Compliance Issues',
      value: '42',
      trend: {
        value: '-25%',
        direction: 'down',
        description: 'Down from 56 last month'
      },
      icon: '⚠️'
    }
  },
  charts: {
    callVolume: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Call Volume',
          data: [12, 18, 15, 22, 24, 18, 12],
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderColor: 'rgba(52, 152, 219, 1)',
          fill: true,
          tension: 0.4,
        },
      ],
    },
    kpiPerformance: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Compliance',
          data: [40, 30, 20, 25, 20, 22],
          backgroundColor: 'rgba(52, 152, 219, 0.8)',
        },
        {
          label: 'Sales',
          data: [22, 13, 25, 38, 48, 35],
          backgroundColor: 'rgba(46, 204, 113, 0.8)',
        },
        {
          label: 'Service',
          data: [55, 70, 50, 45, 60, 75],
          backgroundColor: 'rgba(243, 156, 18, 0.8)',
        },
      ],
    },
    customerSentiment: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Positive',
          data: [65, 55, 70, 65, 60, 75],
          borderColor: 'rgba(46, 204, 113, 1)',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Neutral',
          data: [25, 30, 20, 25, 30, 15],
          borderColor: 'rgba(243, 156, 18, 1)',
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Negative',
          data: [10, 15, 10, 10, 10, 10],
          borderColor: 'rgba(231, 76, 60, 1)',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          tension: 0.4,
        },
      ],
    }
  },
  loading: false,
  error: null
};

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