import React from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip
);

interface KPIMetric {
  name: string;
  score: number;
  status: 'success' | 'warning' | 'danger';
}

interface CallData {
  analysis: {
    kpiAnalysis?: {
      strengths: Array<{ title: string; description: string }>;
      improvements: Array<{ title: string; description: string }>;
    };
  };
  kpiMetrics: { [key: string]: number };
  kpiScore: number;
  kpiDefinitions: any[];
}

interface KPIAnalysisTabProps {
  callData: CallData;
}

const KPIAnalysisTab: React.FC<KPIAnalysisTabProps> = ({ callData }) => {
  const strengths = callData.analysis?.kpiAnalysis?.strengths || [];
  const improvements = callData.analysis?.kpiAnalysis?.improvements || [];
  const kpiMetrics = callData.kpiMetrics;
  const kpiDefinitions = callData.kpiDefinitions;
  const overallScore = callData.kpiScore;
  console.log("callData kpiMetrics", kpiMetrics,kpiDefinitions);
  // Extract scores and labels from metrics for chart
  const metricsWithNames = Object.entries(kpiMetrics).map(([key, score]) => {
    const definition = kpiDefinitions.find(def => def.key === key);
    console.log("kpiMetrics definition",definition,key);
    return {
      name: definition?.name || key,
      score
    };
  });
  
  const labels = metricsWithNames.map(m => m.name);
  const scores = metricsWithNames.map(m => m.score);
  const backgroundColor = scores.map(score => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // amber
    return '#ef4444'; // red
  });

  // Chart data
  const chartData = {
    labels: labels,
    datasets: [
      {
        data: scores,
        backgroundColor: backgroundColor,
        borderRadius: 2,
        maxBarThickness: 20,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Score: ${context.raw}%`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          display: true,
          color: '#e5e7eb',
          drawBorder: false,
        },
        ticks: {
          stepSize: 25,
        }
      },
      y: {
        grid: {
          display: false,
          drawBorder: false,
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="space-y-6 py-6 gap-6">
      {scores.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-6">KPI Performance Breakdown</h3>
          
          <div className="rounded-lg p-4 mb-8 bg-gray-50">
            <div className="h-80">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
          
          <div className="mt-8 rounded-lg p-4 bg-gray-50">
            <h4 className="text-md font-medium mb-4">Overall KPI Score: {overallScore}%</h4>
            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
              <div 
                className="bg-[#00aff0] h-3 rounded-full" 
                style={{ width: `${overallScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Strengths Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium mb-4">KPI Strengths</h3>
          
          <div className="space-y-4">
            {strengths.map((strength, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-green-100 p-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">{strength.title}</h4>
                  <p className="text-gray-600 text-sm">{strength.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Areas for Improvement Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium mb-4">Areas for Improvement</h3>
          
          <div className="space-y-4">
            {improvements.map((improvement, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-amber-100 p-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">{improvement.title}</h4>
                  <p className="text-gray-600 text-sm">{improvement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIAnalysisTab; 