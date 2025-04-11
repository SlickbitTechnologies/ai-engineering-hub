import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CallDetailHeader,
  CallAudioTranscript,
  CallSummary,
  CallInsights
} from '../components/calls';

interface CallData {
  id: number;
  date: string;
  time: string;
  agent: string;
  customer: string;
  duration: string;
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  kpiScore: string;
  isCompliant: boolean;
  transcript: {
    time: string;
    speaker: 'Agent' | 'Customer';
    text: string;
  }[];
  keyMetrics: {
    date: string;
    time: string;
    duration: string;
    category: string;
    agent: string;
    customer: string;
  };
  keyPhrases: string[];
  sentimentAnalysis: {
    positive: number;
  };
  topicsDiscussed: {
    topic: string;
    percentage: number;
  }[];
}

const CallDetailsPage: React.FC = () => {
  console.log('Rendering Call Details page');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock data for the selected call
  const callData: CallData = useMemo(() => ({
    id: parseInt(id || '2'),
    date: '2025-04-10',
    time: '10:24 AM',
    agent: 'Sarah Johnson',
    customer: 'Michael Smith',
    duration: '8:32',
    category: 'Claim Inquiry',
    sentiment: 'Positive',
    kpiScore: '92%',
    isCompliant: true,
    transcript: [
      {
        time: '0:00',
        speaker: 'Agent',
        text: 'I see your claim here for water damage reported on April 2nd. A claims adjuster was assigned to your case, and it looks like they completed an inspection yesterday. Is that correct?'
      },
      {
        time: '0:56',
        speaker: 'Customer',
        text: 'Yes, that\'s right. John came out yesterday and took a lot of photos. I\'m just wondering what the next steps are and when I might expect to hear about the claim amount.'
      },
      {
        time: '1:10',
        speaker: 'Agent',
        text: 'That\'s a great question. According to our system, the adjuster is currently preparing the report. This typically takes 2-3 business days after the inspection. Once the report is complete, you\'ll receive an email with the proposed claim amount and next steps. Based on when the inspection was done, you should expect to hear back by Friday at the latest.'
      }
    ],
    keyMetrics: {
      date: '2025-04-09',
      time: '10:24 AM',
      duration: '8:32',
      category: 'Claim Inquiry',
      agent: 'Sarah Johnson',
      customer: 'Michael Smith'
    },
    keyPhrases: [
      'water damage claim',
      'claim adjuster',
      'inspection report',
      'proposed claim amount', 
      'coverage limit',
      'deductible'
    ],
    sentimentAnalysis: {
      positive: 65
    },
    topicsDiscussed: [
      { topic: 'Claim Status', percentage: 80 },
      { topic: 'Coverage Details', percentage: 60 },
      { topic: 'Next Steps', percentage: 40 }
    ]
  }), [id]);

  const handleBackToList = () => {
    navigate('/calls');
  };

  return (
    <div className="space-y-6 p-4 text-gray-800 bg-gray-50">
      <CallDetailHeader 
        date={`Thursday, ${callData.date}`} 
        onBack={handleBackToList} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CallAudioTranscript 
            duration={callData.duration}
            agent={callData.agent}
            customer={callData.customer}
            category={callData.category}
            transcript={callData.transcript}
          />
        </div>

        <div>
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
          sentimentAnalysis={callData.sentimentAnalysis} 
          topicsDiscussed={callData.topicsDiscussed} 
          kpiScore={callData.kpiScore}
        />
      </div>
    </div>
  );
};

export default CallDetailsPage; 