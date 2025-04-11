import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  title: string;
  data: ChartData<'bar'>;
  height?: number;
  options?: ChartOptions<'bar'>;
}

const BarChart: React.FC<BarChartProps> = ({ title, data, height = 300, options }) => {
  console.log(`Rendering BarChart: ${title}`);
  
  const defaultOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
        align: 'start',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        grid: {
          display: true,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };
  
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div style={{ height: `${height}px` }}>
        <Bar options={mergedOptions} data={data} />
      </div>
    </div>
  );
};

export default BarChart; 