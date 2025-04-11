import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface LineChartProps {
  title: string;
  data: ChartData<'line'>;
  height?: number;
  options?: ChartOptions<'line'>;
}

const LineChart: React.FC<LineChartProps> = ({ title, data, height = 300, options }) => {
  console.log(`Rendering LineChart: ${title}`);
  
  const defaultOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 2,
      },
    },
  };
  
  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div style={{ height: `${height}px` }}>
        <Line options={mergedOptions} data={data} />
      </div>
    </div>
  );
};

export default LineChart; 