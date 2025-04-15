import React, { useMemo } from 'react';
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
import { useGetCallsQuery } from '../redux/callsApi';

const DashboardPage: React.FC = () => {
  console.log('Rendering Dashboard page');

  const { data: callsData, isLoading: isCallsLoading } = useGetCallsQuery({
    page: 1,
    limit: 5,
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Metrics data
  const metricsData = useMemo(() => [
    {
      title: 'Total Calls Analyzed',
      value: '1,287',
      trend: {
        value: '+12%',
        direction: 'up' as const,
        description: 'Last 30 days'
      },
      icon: <LuFileAudio className="text-[#00aff0] text-2xl" />
    },
    {
      title: 'Average Call Duration',
      value: '8:24',
      trend: {
        value: '-8%',
        direction: 'down' as const,
        description: '2:12 less than previous period'
      },
      icon: <CiClock2 className="text-[#00aff0] text-2xl" />
    },
    {
      title: 'KPI Compliance Rate',
      value: '87%',
      trend: {
        value: '+3%',
        direction: 'up' as const,
        description: '3% improvement'
      },
      icon: <FaRegChartBar className="text-[#00aff0] text-2xl" />
    },
    {
      title: 'Compliance Issues',
      value: '42',
      trend: {
        value: '-25%',
        direction: 'down' as const,
        description: 'Down from 56 last month'
      },
      icon: <GoAlert className="text-[#00aff0] text-2xl" />
    }
  ], []);

  // Call volume chart data
  const callVolumeData = useMemo(() => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Call Volume',
        data: [12, 18, 15, 22, 24, 18, 12],
        fill: true,
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        tension: 0.4,
      },
    ],
  }), []);

  // KPI Performance chart data
  const kpiPerformanceData = useMemo(() => ({
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
  }), []);

  // Customer sentiment chart data
  const customerSentimentData = useMemo(() => ({
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
  }), []);

  // Recent calls columns
  const recentCallsColumns: Column[] = useMemo(() => [
    { 
      key: 'date', 
      label: 'Date',
      sortable: true
    },
    { 
      key: 'agent', 
      label: 'Agent',
      sortable: true
    },
    { 
      key: 'customer', 
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
  ], []);

  return (
    <>
      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricsData.map((metric, index) => (
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
          data={callVolumeData} 
          height={250}
        />
        <BarChart 
          title="KPI Performance" 
          data={kpiPerformanceData} 
          height={250}
        />
      </div>
      
      <div className="mb-6">
        <LineChart 
          title="Customer Sentiment Trend" 
          data={customerSentimentData} 
          height={250}
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
          data={callsData?.calls || []}
          emptyMessage={isCallsLoading ? "Loading recent calls..." : "No recent calls found."}
        />
      </div>
    </>
  );
};

export default DashboardPage; 