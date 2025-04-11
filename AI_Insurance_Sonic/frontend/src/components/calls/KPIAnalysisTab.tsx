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

interface KPIAnalysisTabProps {
  overallScore: string;
  metrics: KPIMetric[];
}

const KPIAnalysisTab: React.FC<KPIAnalysisTabProps> = ({
  overallScore,
  metrics = []
}) => {
  console.log('Rendering KPIAnalysisTab component');

  // Default metrics if not provided
  const kpiMetrics = metrics.length > 0 ? metrics : [
    { name: 'Greeting', score: 100, status: 'success' as const },
    { name: 'Identity Verification', score: 100, status: 'success' as const },
    { name: 'Problem Understanding', score: 95, status: 'success' as const },
    { name: 'Solution Offering', score: 98, status: 'success' as const },
    { name: 'Empathy', score: 90, status: 'success' as const },
    { name: 'Required Disclosures', score: 75, status: 'warning' as const },
    { name: 'Closing', score: 96, status: 'success' as const }
  ];
  
  // Extract scores and labels from metrics for chart
  const labels = kpiMetrics.map(metric => metric.name);
  const scores = kpiMetrics.map(metric => metric.score);
  const backgroundColor = kpiMetrics.map(metric => {
    switch(metric.status) {
      case 'success': return '#10b981'; // green
      case 'warning': return '#f59e0b'; // amber
      case 'danger': return '#ef4444';  // red
      default: return '#10b981';
    }
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
  
  // Calculate overall score without % sign
  const scoreValue = parseInt(overallScore.replace('%', ''));
  
  return (
    <div className="space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-6">KPI Performance Breakdown</h3>
        
        <div className="rounded-lg p-4 mb-8 bg-gray-50">
          <div className="h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="mt-8 rounded-lg p-4 bg-gray-50">
          <h4 className="text-md font-medium mb-4">Overall KPI Score: {overallScore}</h4>
          <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
            <div 
              className="bg-[#00aff0] h-3 rounded-full" 
              style={{ width: `${scoreValue}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* KPI Strengths and Areas for Improvement Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Strengths Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium mb-4">KPI Strengths</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-green-100 p-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Proper Greeting</h4>
                <p className="text-gray-600 text-sm">Agent correctly identified themselves and greeted the customer professionally.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-green-100 p-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Identity Verification</h4>
                <p className="text-gray-600 text-sm">Agent properly verified customer identity before discussing account details.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-green-100 p-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Solution Offering</h4>
                <p className="text-gray-600 text-sm">Agent provided clear explanations and actionable next steps.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Areas for Improvement Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium mb-4">Areas for Improvement</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-amber-100 p-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Required Disclosures</h4>
                <p className="text-gray-600 text-sm">Agent could have been more thorough with policy disclosure information.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-green-100 p-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Empathy</h4>
                <p className="text-gray-600 text-sm">Agent showed good empathy but could further improve emotional connection.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIAnalysisTab; 