import OpenAI from 'openai';
import { Readable } from 'stream';
import { File } from 'buffer';
import dotenv from 'dotenv';

dotenv.config();

console.log("OPENAI_API_KEY", process.env.OPENAI_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface TopicMention {
  topic: string;
  mentions: number;
}

interface ConversationAnalysis {
  transcription: string;
  sentiment: string;
  sentimentAnalysis: {
    positive: number;
    negative: number;
    neutral: number;
    topicsDiscussed: TopicMention[];
  };
  agentName?: string;
  customerName?: string;
  category: string;
  summary: string;
  conversation: Array<{
    speaker: "Agent" | "Customer";
    content: string;
  }>;
  keyPoints: string[];
  actionItems?: string[];
  customerMood: string;
  emotional: {
    satisfaction: number;
    frustration: number;
    confidence: number;
    confusion: number;
  };
  kpiMetrics: {
    greeting: number;
    identityVerification: number;
    problemUnderstanding: number;
    solutionOffering: number;
    empathy: number;
    requiredDisclosures: number;
    closing: number;
  };
  kpiScore: number;
  agentPerformance: {
    professionalism: number;
    helpfulness: number;
    clarity: number;
  };
}

const ANALYSIS_PROMPT = `You are a conversation analyzer. 
Please rewrite it as a structured conversation between two speakers (Agent and Customer), using natural dialogue formatting.
Analyze the provided conversation and return ONLY a JSON object with the following structure, no additional text:
{
  "sentiment": "positive|negative|neutral",
  "sentimentAnalysis": {
    "positive": number(0-100),
    "negative": number(0-100),
    "neutral": number(0-100),
    "topicsDiscussed": [
      {
        "topic": "string",
        "mentions": number
      }
    ]
  },
  "agentName": "string or null",
  "customerName": "string or null",
  "category": "string (compliance, sales, service)",
  "summary": "brief summary",
  "conversation": [
    {
      "speaker": "Agent|Customer",
      "content": "exact spoken content"
    }
  ],
  "emotional": {
    "satisfaction": number(0-100),
    "frustration": number(0-100),
    "confidence": number(0-100),
    "confusion": number(0-100)
  },
  "kpiMetrics": {
    "greeting": number(0-100),
    "identityVerification": number(0-100),
    "problemUnderstanding": number(0-100),
    "solutionOffering": number(0-100),
    "empathy": number(0-100),
    "requiredDisclosures": number(0-100),
    "closing": number(0-100)
  },
  "kpiScore": number(0-100),
  "keyPoints": ["point1", "point2", ...],
  "actionItems": ["item1", "item2", ...],
  "customerMood": "detailed mood description",
  "agentPerformance": {
    "professionalism": number(0-100),
    "helpfulness": number(0-100),
    "clarity": number(0-100)
  }
}`;

export const transcribeAndAnalyze = async (
  audioBuffer: Buffer,
  fileName: string
): Promise<ConversationAnalysis> => {
  try {
    const file = new File([audioBuffer], fileName, { type: 'audio/mp3' });

    // First, get the transcription
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
      response_format: "text"
    });
    console.log("TRANSCRIPTION_PROMPT", transcriptionResponse);
    // Then, analyze the transcription using GPT-4
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: ANALYSIS_PROMPT
        },
        {
          role: "user",
          content: transcriptionResponse
        }
      ]
    });

    const analysis = JSON.parse(analysisResponse.choices[0].message.content || '{}');
    
    console.log('Conversation analysis:', analysis);
    const data = {
      transcription: transcriptionResponse,
      sentiment: analysis.sentiment,
      sentimentAnalysis: analysis.sentimentAnalysis,
      agentName: analysis.agentName,
      customerName: analysis.customerName,
      summary: analysis.summary,
      conversation: analysis.conversation,
      keyPoints: analysis.keyPoints,
      actionItems: analysis.actionItems,
      customerMood: analysis.customerMood,
      category: analysis.category,
      emotional: analysis.emotional,
      kpiMetrics: analysis.kpiMetrics,
      kpiScore: analysis.kpiScore,
      agentPerformance: analysis.agentPerformance
    };
    console.log("DATA", data);
    return data;
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw new Error('Failed to analyze audio');
  }
}; 