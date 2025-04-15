import React, { useState } from 'react';
import SentimentAnalysisTab from './SentimentAnalysisTab';
import KPIAnalysisTab from './KPIAnalysisTab';

interface TopicData {
  topic: string;
  percentage: number;
}

type KPIStatus = 'success' | 'warning' | 'danger';

interface CallInsightsProps {
  sentimentAnalysis: {
    positive: number;
    negative?: number;
    neutral?: number;
  };
  topicsDiscussed: TopicData[];
  kpiScore: string;
  kpiMetrics?: {
    greeting: number;
    identityVerification: number;
    problemUnderstanding: number;
    solutionOffering: number;
    empathy: number;
    requiredDisclosures: number;
    closing: number;
  };
  emotional: {
    satisfaction: number;
    frustration: number;
    confidence: number;
    confusion: number;
  };
}

const getStatusFromScore = (score: number): KPIStatus => {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'danger';
};

const CallInsights: React.FC<CallInsightsProps> = ({ 
  sentimentAnalysis, 
  topicsDiscussed,
  kpiScore,
  kpiMetrics,
  emotional
}) => {
  console.log('Rendering CallInsights component');
  
  const [activeTab, setActiveTab] = useState('insights');
  
  // Convert kpiMetrics to the format expected by KPIAnalysisTab
  const formattedKPIMetrics = kpiMetrics ? [
    { name: 'Greeting', score: kpiMetrics.greeting, status: getStatusFromScore(kpiMetrics.greeting) },
    { name: 'Identity Verification', score: kpiMetrics.identityVerification, status: getStatusFromScore(kpiMetrics.identityVerification) },
    { name: 'Problem Understanding', score: kpiMetrics.problemUnderstanding, status: getStatusFromScore(kpiMetrics.problemUnderstanding) },
    { name: 'Solution Offering', score: kpiMetrics.solutionOffering, status: getStatusFromScore(kpiMetrics.solutionOffering) },
    { name: 'Empathy', score: kpiMetrics.empathy, status: getStatusFromScore(kpiMetrics.empathy) },
    { name: 'Required Disclosures', score: kpiMetrics.requiredDisclosures, status: getStatusFromScore(kpiMetrics.requiredDisclosures) },
    { name: 'Closing', score: kpiMetrics.closing, status: getStatusFromScore(kpiMetrics.closing) }
  ] : [];
  
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
          positive={sentimentAnalysis.positive} 
          neutral={sentimentAnalysis.neutral || 0} 
          negative={sentimentAnalysis.negative || 0}
          topicsDiscussed={topicsDiscussed}
          emotional={emotional}
        />
      )}

      {activeTab === 'kpi' && (
        <KPIAnalysisTab 
          overallScore={kpiScore}
          metrics={formattedKPIMetrics}
        />
      )}
    </div>
  );
};

export default CallInsights; 