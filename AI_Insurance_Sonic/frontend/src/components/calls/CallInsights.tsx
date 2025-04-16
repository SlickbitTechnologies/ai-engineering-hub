import React, { useState } from 'react';
import SentimentAnalysisTab from './SentimentAnalysisTab';
import KPIAnalysisTab from './KPIAnalysisTab';
import { useGetKPIMetricsQuery } from '../../redux/configurationApi';

interface TopicData {
  topic: string;
  percentage: number;
}

type KPIStatus = 'success' | 'warning' | 'danger';

interface CallInsightsProps {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topicsDiscussed: TopicData[];
  kpiScore: number;
  kpiMetrics: {
    [key: string]: number;
  };
  emotional: {
    satisfaction: number;
    frustration: number;
    confidence: number;
    confusion: number;
  };
  kpiAnalysis: {
    strengths: Array<{ title: string; description: string }>;
    improvements: Array<{ title: string; description: string }>;
  };
}

const getStatusFromScore = (score: number): KPIStatus => {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'danger';
};

const CallInsights: React.FC<CallInsightsProps> = ({ 
  sentiment, 
  emotional,
  kpiMetrics,
  kpiScore,
  topicsDiscussed,
  kpiAnalysis
}) => {
  console.log('Rendering CallInsights component kpiAnalysis',kpiAnalysis);
  
  const [activeTab, setActiveTab] = useState('insights');
  
  const { data: kpiDefinitions = [] } = useGetKPIMetricsQuery();
  
  const formattedKPIMetrics = kpiMetrics ? 
    kpiDefinitions
      .filter(def => def.enabled)
      .map(def => ({
        name: def.name,
        score: kpiMetrics[def.key] || 0,
        status: getStatusFromScore(kpiMetrics[def.key] || 0)
      }))
    : [];
  
  return (
    <div>
      <div className="bg-gray-50">
        <div className="flex p-1.5 w-fit bg-gray-100 rounded-md">
          <button 
            className={`px-6 py-1 text-sm font-medium border-b-2 rounded-sm  ${
              activeTab === 'insights' 
                ? 'border-transparent text-[#00aff0] bg-white' 
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('insights')}
          >
            Call Insights
          </button>
          <button 
            className={`px-6 py-1 text-sm font-medium border-b-2 rounded-sm  ${
              activeTab === 'kpi' 
                ? 'border-transparent text-[#00aff0] bg-white' 
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
          positive={sentiment.positive}
          neutral={sentiment.neutral}
          negative={sentiment.negative}
          topicsDiscussed={topicsDiscussed}
          emotional={emotional}
        />
      )}

      {activeTab === 'kpi' && (
        <KPIAnalysisTab 
          callData={{
            analysis: {
              kpiAnalysis: kpiAnalysis
            },
            kpiMetrics: kpiMetrics,
            kpiScore: kpiScore,
            kpiDefinitions: kpiDefinitions
          }}
        />
      )}
    </div>
  );
};

export default CallInsights; 