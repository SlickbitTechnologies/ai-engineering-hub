import React from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Title
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Title
);

interface EmotionalAnalysisProps {
  emotional: {
    satisfaction: number;
    frustration: number;
    confidence: number;
    confusion: number;
  };
}

const EmotionalAnalysisChart: React.FC<EmotionalAnalysisProps> = ({ emotional }) => {
  // Emotional analysis data
  const emotionalAnalysisData = {
    labels: ['Satisfaction', 'Confidence', 'Confusion', 'Frustration'],
    datasets: [
      {
        data: [
          emotional.satisfaction,
          emotional.confidence,
          emotional.confusion,
          emotional.frustration
        ],
        backgroundColor: [
          '#10b981', // green for positive emotions
          '#10b981', 
          '#ef4444', // red for negative emotions
          '#ef4444'
        ],
        borderRadius: 4,
      },
    ],
  };
  
  const emotionalAnalysisOptions = {
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Emotional Analysis',
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
          display: false,
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="p-4 rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-4">Emotional Analysis</h3>
      <div className="h-64">
        <Bar data={emotionalAnalysisData} options={emotionalAnalysisOptions} />
      </div>
    </div>
  );
};

export default EmotionalAnalysisChart; 