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

interface TopicsBarChartProps {
  topics: Array<{ topic: string; percentage: number; }>;
}

const TopicsBarChart: React.FC<TopicsBarChartProps> = ({ topics }) => {
  console.log('Rendering TopicsBarChart component');
  
  // Bar chart data for topics
  const barData = {
    labels: topics.map(t => t.topic),
    datasets: [
      {
        data: topics.map(t => t.percentage),
        backgroundColor: '#0ea5e9', // blue
        borderRadius: 4,
      },
    ],
  };
  
  const barOptions = {
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.raw} mentions`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          display: true,
        },
      },
      y: {
        grid: {
          display: true,
          color: '#e5e7eb',
          drawBorder: false,
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="p-4  rounded-lg bg-white ">
      <h3 className="text-lg font-medium mb-4">Topics Discussed</h3>
      <div className="h-80">
        <Bar data={barData} options={barOptions} />
      </div>
    </div>
  );
};

export default TopicsBarChart; 