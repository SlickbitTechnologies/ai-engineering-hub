import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface SentimentPieChartProps {
  positive: number;
  neutral: number;
  negative: number;
}

const SentimentPieChart: React.FC<SentimentPieChartProps> = ({
  positive,
  neutral,
  negative
}) => {
  console.log('Rendering SentimentPieChart component');
  
  // Pie chart data
  const pieData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [positive, neutral, negative],
        backgroundColor: [
          '#10b981', // green for positive
          '#f59e0b', // amber for neutral
          '#ef4444'  // red for negative
        ],
        borderColor: [
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const pieOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
    maintainAspectRatio: true,
    responsive: true,
  };

    return (
      <div className="p-4  rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-4">Sentiment Analysis</h3>
      <div className="mb-4 relative h-64 w-64 mx-auto">
        <Pie data={pieData} options={pieOptions} />
      </div>
      <div className="flex justify-between mt-4 px-4">
        <div className="text-center">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className="text-sm text-green-500 font-medium">Positive {positive}%</span>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
            <span className="text-sm text-amber-500 font-medium">Neutral {neutral}%</span>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span className="text-sm text-red-500 font-medium">Negative {negative}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentPieChart; 