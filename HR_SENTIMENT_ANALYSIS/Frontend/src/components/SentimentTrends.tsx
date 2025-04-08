import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Download } from 'lucide-react';
import { SentimentData } from '../types/sentiment';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SentimentTrendsProps {
  data: SentimentData;
}

const SentimentTrends: React.FC<SentimentTrendsProps> = ({ data }) => {
  // Get the current date for the latest data point
  const currentDate = new Date();
  const timeLabels = [currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })];

  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Positive',
        data: [data.positive],
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Neutral',
        data: [data.neutral],
        borderColor: '#93c5fd',
        backgroundColor: 'rgba(147, 197, 253, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Negative',
        data: [data.negative],
        borderColor: '#fca5a5',
        backgroundColor: 'rgba(252, 165, 165, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Current Sentiment Distribution</h2>
          <p className="text-sm text-gray-600">
            Based on {data.total.toLocaleString()} responses
          </p>
        </div>
        <button className="text-gray-600 hover:text-gray-900">
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-sm text-gray-600">Positive</div>
          <div className="text-lg font-semibold text-green-600">{data.positive}%</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Neutral</div>
          <div className="text-lg font-semibold text-blue-600">{data.neutral}%</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Negative</div>
          <div className="text-lg font-semibold text-red-600">{data.negative}%</div>
        </div>
      </div>
    </div>
  );
};

export default SentimentTrends; 