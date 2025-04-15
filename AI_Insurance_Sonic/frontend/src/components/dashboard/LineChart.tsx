import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export interface LineChartProps {
  title: string;
  data: ChartData<'line'>;
  height?: number;
  options?: ChartOptions<'line'>;
  isLoading?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({ title, data, height = 400, options, isLoading = false }) => {
  const defaultOptions: ChartOptions<'line'> = {
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
      <Line
        data={data}
        options={{ ...defaultOptions, ...options }}
        height={height}
      />
    </div>
  );
};

export default LineChart; 