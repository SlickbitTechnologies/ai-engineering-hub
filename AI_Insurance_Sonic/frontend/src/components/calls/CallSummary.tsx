import React from 'react';

interface KeyMetrics {
  date: string;
  time: string;
  duration: string;
  category: string;
  agent: string;
  customer: string;
}

interface CallSummaryProps {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  isCompliant: boolean;
  kpiScore: string;
  keyMetrics: KeyMetrics;
  keyPhrases: string[];
}

const CallSummary: React.FC<CallSummaryProps> = ({
  sentiment,
  isCompliant,
  kpiScore,
  keyMetrics,
  keyPhrases
}) => {
  console.log('Rendering CallSummary component');

  // Render sentiment badge
  const renderSentimentBadge = (sentiment: 'Positive' | 'Neutral' | 'Negative') => {
    switch (sentiment) {
      case 'Positive':
        return <div className="flex items-center">
          <div className="mr-1 text-green-500 text-xl">⬤</div>
          <div>Positive</div>
        </div>;
      case 'Neutral':
        return <div className="flex items-center">
          <div className="mr-1 text-gray-500 text-xl">⬤</div>
          <div>Neutral</div>
        </div>;
      case 'Negative':
        return <div className="flex items-center">
          <div className="mr-1 text-red-500 text-xl">⬤</div>
          <div>Negative</div>
        </div>;
      default:
        return sentiment;
    }
  };

  // Render compliance badge
  const renderComplianceBadge = (isCompliant: boolean) => {
    return isCompliant ? (
      <div className="flex items-center">
        <div className="mr-1 text-green-500 text-xl">✓</div>
        <div>Compliant</div>
      </div>
    ) : (
      <div className="flex items-center">
        <div className="mr-1 text-red-500 text-xl">✕</div>
        <div>Non-Compliant</div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-medium text-gray-900">Call Summary</h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Sentiment</div>
            {renderSentimentBadge(sentiment)}
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Compliance</div>
            {renderComplianceBadge(isCompliant)}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">KPI Score</h3>
          <div className="flex items-center mb-1 justify-end">
            <span className="text-sm font-medium text-[#00aff0]">
              {kpiScore}
            </span>
          </div>
          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
            <div 
              style={{ width: parseInt(kpiScore) + '%' }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#00aff0] rounded-full"
            ></div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Key Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Date & Time</span>
                <span className="text-sm">{keyMetrics.date}, {keyMetrics.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Duration</span>
                <span className="text-sm">{keyMetrics.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Category</span>
                <span className="text-sm">{keyMetrics.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Agent</span>
                <span className="text-sm">{keyMetrics.agent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Customer</span>
                <span className="text-sm">{keyMetrics.customer}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Key Phrases</h3>
            <div className="flex flex-wrap gap-2">
              {keyPhrases.map((phrase, idx) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs">
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallSummary; 