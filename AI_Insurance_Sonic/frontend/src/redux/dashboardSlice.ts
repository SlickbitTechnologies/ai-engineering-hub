import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types for the dashboard state
export interface MetricTrend {
  value: string;
  direction: 'up' | 'down';
  description?: string;
}

export interface MetricData {
  title: string;
  value: string | number;
  trend?: MetricTrend;
  icon?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  fill?: boolean;
  tension?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface DashboardState {
  metrics: {
    totalCalls: MetricData;
    averageCallDuration: MetricData;
    kpiComplianceRate: MetricData;
    complianceIssues: MetricData;
  };
  charts: {
    callVolume: ChartData;
    kpiPerformance: ChartData;
    customerSentiment: ChartData;
  };
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: DashboardState = {
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

// Create the slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    fetchDashboardDataStart(state) {
      console.log('Fetching dashboard data');
      state.loading = true;
      state.error = null;
    },
    fetchDashboardDataSuccess(state, action: PayloadAction<DashboardState>) {
      console.log('Dashboard data fetched successfully');
      state.metrics = action.payload.metrics;
      state.charts = action.payload.charts;
      state.loading = false;
    },
    fetchDashboardDataFailure(state, action: PayloadAction<string>) {
      console.error('Failed to fetch dashboard data:', action.payload);
      state.loading = false;
      state.error = action.payload;
    },
  },
});

// Export actions and reducer
export const { 
  fetchDashboardDataStart,
  fetchDashboardDataSuccess,
  fetchDashboardDataFailure
} = dashboardSlice.actions;

export default dashboardSlice.reducer; 