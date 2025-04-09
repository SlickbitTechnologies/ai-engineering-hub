import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Download } from 'lucide-react';
import { SentimentData } from '../types/sentiment';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

interface SentimentDistributionProps {
  data: SentimentData;
}

const SentimentDistribution: React.FC<SentimentDistributionProps> = ({ data }) => {
  const chartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [data.positive, data.neutral, data.negative],
        backgroundColor: ['#4ade80', '#93c5fd', '#fca5a5'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    cutout: '75%',
    plugins: {
      legend: {
        display: false,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Sentiment Distribution</h2>
          <p className="text-sm text-gray-600">
            Overall sentiment from {data.total.toLocaleString()} employee responses
          </p>
        </div>
        <button className="text-gray-600 hover:text-gray-900">
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5">
          <div className="relative h-72 flex items-center justify-center">
            <div className="w-56 h-56 relative">
              <Doughnut 
                data={chartData} 
                options={chartOptions}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white shadow-sm rounded-full p-4 h-24 w-24 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-green-500">{data.positive}%</div>
                <div className="text-xs text-gray-600 font-medium">Positive</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-4 space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
              <span className="text-sm">Positive</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
              <span className="text-sm">Neutral</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
              <span className="text-sm">Negative</span>
            </div>
          </div>
        </div>

        <div className="col-span-7">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.positive}%</div>
              <div className="text-sm text-green-700">Positive Sentiment</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.neutral}%</div>
              <div className="text-sm text-blue-700">Neutral Sentiment</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{data.negative}%</div>
              <div className="text-sm text-red-700">Negative Sentiment</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium mb-2">Sentiment Breakdown</h3>
            {[
              { label: 'Strongly Positive', value: data.breakdown.stronglyPositive, color: 'bg-green-500' },
              { label: 'Somewhat Positive', value: data.breakdown.somewhatPositive, color: 'bg-green-300' },
              { label: 'Neutral', value: data.breakdown.neutral, color: 'bg-blue-300' },
              { label: 'Somewhat Negative', value: data.breakdown.somewhatNegative, color: 'bg-red-300' },
              { label: 'Strongly Negative', value: data.breakdown.stronglyNegative, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm">{item.label}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-sm">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentDistribution; 