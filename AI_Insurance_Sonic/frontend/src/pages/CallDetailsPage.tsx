import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CallDetailHeader,
  CallAudioTranscript,
  CallSummary,
  CallInsights
} from '../components/calls';
import { useGetCallByIdQuery } from '../redux/callsApi';

const CallDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: callData, isLoading, error } = useGetCallByIdQuery(id || '');
console.log("callData",callData?.kpiScore);
  const handleBackToList = () => {
    navigate('/calls');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading call details...</div>
      </div>
    );
  }

  if (error || !callData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error loading call details</div>
      </div>
    );
  }
  console.log("callData kpiAnalysis",callData.kpiAnalysis);
  return (
    <div className="space-y-6 p-4 text-gray-800 bg-gray-50">
      <CallDetailHeader 
        date={`Thursday, ${callData.date}`} 
        onBack={handleBackToList} 
        audioFileId={callData.id}
        callData={callData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Call Transcript</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CallAudioTranscript 
                duration={callData.duration}
                agent={callData.agent}
                customer={callData.customer}
                category={callData.category}
                transcript={callData.transcript}
                audioUrl={callData.url}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow h-full">
          <CallSummary 
            sentiment={callData.sentiment}
            isCompliant={callData.isCompliant}
            kpiScore={callData.kpiScore}
            keyMetrics={callData.keyMetrics}
            keyPhrases={callData.keyPhrases}
          />
        </div>
      </div>
      
      <div className="mt-6">
        <CallInsights 
          sentiment={callData.sentimentAnalysis} 
          topicsDiscussed={callData.topicsDiscussed} 
          kpiScore={Number(callData.kpiScore.replace('%', ''))}
          kpiMetrics={callData.kpiMetrics}
          emotional={callData.emotional}
          kpiAnalysis={callData.kpiAnalysis}
        />
      </div>
    </div>
  );
};

export default CallDetailsPage; 