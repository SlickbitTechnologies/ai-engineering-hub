import React, { useState } from 'react';
import { FaRegChartBar, FaExternalLinkAlt } from 'react-icons/fa';
import { LuFileAudio } from 'react-icons/lu';
import { CiClock2 } from 'react-icons/ci';
import { GoAlert } from 'react-icons/go';
import MetricCard from '../components/dashboard/MetricCard';
import LineChart from '../components/dashboard/LineChart';
import BarChart from '../components/dashboard/BarChart';
import { Link } from 'react-router-dom';
import { DataTable } from '../components/common';
import { Column } from '../components/common/DataTable';
import {
  useGetDashboardMetricsQuery,
  useGetCallVolumeTrendQuery,
  useGetKpiPerformanceQuery,
  useGetSentimentTrendQuery,
  useGetRecentCallsQuery,
} from '../redux/dashboardApi';
import { ChartData } from 'chart.js';

const DashboardPage: React.FC = () => {
  // Fetch data using RTK Query hooks
  const { data: metricsData, isLoading: isMetricsLoading } = useGetDashboardMetricsQuery();
  const { data: callVolumeData, isLoading: isCallVolumeLoading } = useGetCallVolumeTrendQuery('week');
  const { data: kpiData, isLoading: isKpiLoading } = useGetKpiPerformanceQuery('month');
  const { data: sentimentData, isLoading: isSentimentLoading } = useGetSentimentTrendQuery('month');
  const { data: recentCalls, isLoading: isRecentCallsLoading } = useGetRecentCallsQuery(5);

  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Transform API data to chart.js format
  const callVolumeChartData: ChartData<'line'> = {
    labels: callVolumeData?.labels || [],
    datasets: [
      {
        label: 'Call Volume',
        data: callVolumeData?.data || [],
        fill: true,
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        tension: 0.4,
      },
    ],
  };

  const kpiChartData: ChartData<'bar'> = {
    labels: kpiData?.labels || [],
    datasets: kpiData?.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.label === 'Compliance' 
        ? 'rgba(52, 152, 219, 0.8)'
        : dataset.label === 'Sales'
        ? 'rgba(46, 204, 113, 0.8)'
        : 'rgba(243, 156, 18, 0.8)',
    })) || [],
  };

  const sentimentChartData: ChartData<'line'> = {
    labels: sentimentData?.labels || [],
    datasets: sentimentData?.datasets.map(dataset => ({
      ...dataset,
      fill: true,
      tension: 0.4,
      backgroundColor: dataset.label === 'Positive'
        ? 'rgba(46, 204, 113, 0.1)'
        : dataset.label === 'Neutral'
        ? 'rgba(243, 156, 18, 0.1)'
        : 'rgba(231, 76, 60, 0.1)',
      borderColor: dataset.label === 'Positive'
        ? 'rgba(46, 204, 113, 1)'
        : dataset.label === 'Neutral'
        ? 'rgba(243, 156, 18, 1)'
        : 'rgba(231, 76, 60, 1)',
    })) || [],
  };

  // Metrics cards data
  const metricCards = [
    {
      title: 'Total Calls Analyzed',
      value: metricsData ? metricsData.totalCalls.toLocaleString() : '-',
      trend: metricsData ? {
        value: metricsData.trends.totalCalls,
        direction: metricsData.trends.totalCalls.startsWith('+') ? 'up' as const : 'down' as const,
        description: 'Last 30 days'
      } : undefined,
      icon: <LuFileAudio className="text-[#00aff0] text-2xl" />
    },
    {
      title: 'Average Call Duration',
      value: metricsData ? metricsData.averageDuration : '-',
      trend: metricsData ? {
        value: metricsData.trends.averageDuration,
        direction: metricsData.trends.averageDuration.startsWith('+') ? 'up' as const : 'down' as const,
        description: 'vs previous period'
      } : undefined,
      icon: <CiClock2 className="text-[#00aff0] text-2xl" />
    },
    {
      title: 'KPI Compliance Rate',
      value: metricsData ? `${metricsData.kpiComplianceRate.toFixed(1)}%` : '-',
      trend: metricsData ? {
        value: metricsData.trends.kpiComplianceRate,
        direction: metricsData.trends.kpiComplianceRate.startsWith('+') ? 'up' as const : 'down' as const,
        description: 'vs previous period'
      } : undefined,
      icon: <FaRegChartBar className="text-[#00aff0] text-2xl" />
    },
    {
      title: 'Compliance Issues',
      value: metricsData ? metricsData.complianceIssues.toString() : '-',
      trend: metricsData ? {
        value: metricsData.trends.complianceIssues,
        direction: metricsData.trends.complianceIssues.startsWith('+') ? 'down' as const : 'up' as const,
        description: 'vs previous period'
      } : undefined,
      icon: <GoAlert className="text-[#00aff0] text-2xl" />
    }
  ];

  // Recent calls columns
  const recentCallsColumns: Column[] = [
    { 
      key: 'date', 
      label: 'Date',
      sortable: true
    },
    { 
      key: 'agentName', 
      label: 'Agent',
      sortable: true
    },
    { 
      key: 'customerName', 
      label: 'Customer',
      sortable: true
    },
    { 
      key: 'duration', 
      label: 'Duration',
      sortable: true
    },
    { 
      key: 'category', 
      label: 'Category',
      sortable: true
    },
    { 
      key: 'sentiment', 
      label: 'Sentiment',
      sortable: true,
      render: (sentiment) => {
        switch (sentiment) {
          case 'Positive':
            return <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">Positive</span>;
          case 'Neutral':
            return <span className="px-2 py-1 bg-gray-500 text-white rounded-full text-xs font-medium">Neutral</span>;
          case 'Negative':
            return <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">Negative</span>;
          default:
            return sentiment;
        }
      }
    },
    {
      key: 'action',
      label: 'Action',
      align: 'right',
      render: (_, item) => (
        <Link to={`/calls/${item.id}`} className="font-medium text-[#00aff0] hover:text-[#0099d6]">
          View
        </Link>
      )
    }
  ];

  return (
    <>
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            trend={metric.trend}
            icon={metric.icon}
          />
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart 
          title="Call Volume Trend" 
          data={callVolumeChartData}
          height={250}
          isLoading={isCallVolumeLoading}
        />
        <BarChart 
          title="KPI Performance" 
          data={kpiChartData}
          height={250}
          isLoading={isKpiLoading}
        />
      </div>
      
      <div className="mb-6">
        <LineChart 
          title="Customer Sentiment Trend" 
          data={sentimentChartData}
          height={250}
          isLoading={isSentimentLoading}
          options={{
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  boxWidth: 10,
                  padding: 20,
                },
              },
            },
          }}
        />
      </div>

      {/* Recent Calls Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-medium text-gray-900">Recent Calls</h2>
          <Link to="/calls" className="text-[#00aff0] hover:text-[#0099d6] flex items-center text-sm font-medium">
            View All <FaExternalLinkAlt className="ml-1 text-xs" />
          </Link>
        </div>
        <DataTable
          columns={recentCallsColumns}
          data={recentCalls || []}
          emptyMessage={isRecentCallsLoading ? "Loading recent calls..." : "No recent calls found."}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>
    </>
  );
};

export default DashboardPage; 