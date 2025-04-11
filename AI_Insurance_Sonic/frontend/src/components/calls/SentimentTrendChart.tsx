import React from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Title
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Title
);

const SentimentTrendChart: React.FC = () => {
  console.log('Rendering SentimentTrendChart component');
  
  // Sentiment trend over call data
  const sentimentTrendData = {
    labels: ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00'],
    datasets: [
      {
        label: 'Sentiment',
        data: [60, 65, 70, 65, 55, 75, 80, 85, 95],
        fill: true,
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        borderColor: 'rgba(14, 165, 233, 1)',
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };
  
  const sentimentTrendOptions = {
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Sentiment Trend Over Call',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        },
        color: '#374151'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="p-4  rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-4">Sentiment Trend Over Call</h3>
      <div className="h-64">
        <Line data={sentimentTrendData} options={sentimentTrendOptions} />
      </div>
    </div>
  );
};

export default SentimentTrendChart; 