import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface BarChartProps {
  title: string;
  data: ChartData<'bar'>;
  height?: number;
  options?: ChartOptions<'bar'>;
  isLoading?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ title, data, height = 400, options, isLoading = false }) => {
  const defaultOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow" style={{ height }}>
        <div className="animate-pulse flex flex-col h-full">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex-1 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <Bar
        data={data}
        options={{ ...defaultOptions, ...options }}
        height={height}
      />
    </div>
  );
};

export default BarChart; 