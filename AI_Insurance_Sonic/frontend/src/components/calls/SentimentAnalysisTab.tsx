import React from 'react';
import SentimentPieChart from './SentimentPieChart';
import TopicsBarChart from './TopicsBarChart';
import SentimentTrendChart from './SentimentTrendChart';
import EmotionalAnalysisChart from './EmotionalAnalysisChart';

interface SentimentAnalysisTabProps {
  positive: number;
  neutral: number;
  negative: number;
}

const SentimentAnalysisTab: React.FC<SentimentAnalysisTabProps> = ({
  positive,
  neutral,
  negative
}) => {
  console.log('Rendering SentimentAnalysisTab component');

  return (
    <div className="space-y-8 gap-6">
      {/* Card 1: Sentiment Overview */}
      <div className="p-4 rounded-lg bg-white">
        <h3 className="text-lg font-medium mb-4">Sentiment Overview</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SentimentPieChart 
            positive={positive} 
            neutral={neutral} 
            negative={negative} 
          />
          <TopicsBarChart />
        </div>
      </div>
      
      {/* Card 2: Sentiment Trend */}
      <div className="p-4 rounded-lg bg-white">
        <SentimentTrendChart />
      </div>
      
      {/* Card 3: Emotional Analysis */}
      <div className="p-4 rounded-lg bg-white">
        <EmotionalAnalysisChart />
      </div>
    </div>
  );
};

export default SentimentAnalysisTab; 