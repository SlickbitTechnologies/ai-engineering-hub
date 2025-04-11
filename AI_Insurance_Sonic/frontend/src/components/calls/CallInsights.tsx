import React, { useState } from 'react';
import SentimentAnalysisTab from './SentimentAnalysisTab';
import KPIAnalysisTab from './KPIAnalysisTab';

interface TopicData {
  topic: string;
  percentage: number;
}

interface CallInsightsProps {
  sentimentAnalysis: {
    positive: number;
  };
  topicsDiscussed: TopicData[];
  kpiScore: string;
}

const CallInsights: React.FC<CallInsightsProps> = ({ 
  sentimentAnalysis, 
  topicsDiscussed,
  kpiScore
}) => {
  console.log('Rendering CallInsights component');
  
  const [activeTab, setActiveTab] = useState('insights');
  
  // KPI metrics mock data (in real app would be passed as props)
  const kpiMetrics = [
    { name: 'Greeting', score: 100, status: 'success' as const },
    { name: 'Identity Verification', score: 100, status: 'success' as const },
    { name: 'Problem Understanding', score: 95, status: 'success' as const },
    { name: 'Solution Offering', score: 98, status: 'success' as const },
    { name: 'Empathy', score: 90, status: 'success' as const },
    { name: 'Required Disclosures', score: 75, status: 'warning' as const },
    { name: 'Closing', score: 96, status: 'success' as const }
  ];
  
  return (
    <div>
      <div className="bg-gray-50">
        <div className="flex">
          <button 
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'insights' 
                ? 'border-[#00aff0] text-[#00aff0]' 
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('insights')}
          >
            Call Insights
          </button>
          <button 
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'kpi' 
                ? 'border-[#00aff0] text-[#00aff0]' 
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('kpi')}
          >
            KPI Analysis
          </button>
        </div>
      </div>

      {activeTab === 'insights' && (
        <SentimentAnalysisTab 
          positive={65} 
          neutral={30} 
          negative={5} 
        />
      )}

      {activeTab === 'kpi' && (
        <KPIAnalysisTab 
          overallScore={kpiScore}
          metrics={kpiMetrics}
        />
      )}
    </div>
  );
};

export default CallInsights; 