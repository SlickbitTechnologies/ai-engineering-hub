import OpenAI from 'openai';
import { Readable } from 'stream';
import { File } from 'buffer';
import dotenv from 'dotenv';
import KPIMetric from '../db/models/KPIMetric';

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
    [key: string]: number;
  };
  kpiScore: number;
  agentPerformance: {
    professionalism: number;
    helpfulness: number;
    clarity: number;
  };
  kpiAnalysis: {
    strengths: Array<{ title: string; description: string }>;
    improvements: Array<{ title: string; description: string }>;
  };
}

async function getAnalysisPrompt(): Promise<string> {
  try {
    // Fetch enabled KPI metrics from the database
    const metrics = await KPIMetric.findAll({
      where: { enabled: true },
      attributes: ['key', 'name', 'description'],
      order: [['createdAt', 'ASC']]
    });

    // Generate the KPI metrics section of the prompt
    const kpiMetricsPrompt = metrics.map(metric => 
      `${metric.key} (${metric.name}): ${metric.description}`
    ).join('\n');

    return `You are a conversation analyzer. 
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
    ${metrics.map(m => `"${m.key}": number(0-100)`).join(',\n    ')}
  },
  "kpiScore": number(0-100),
  "keyPoints": ["point1", "point2", ...],
  "actionItems": ["item1", "item2", ...],
  "customerMood": "detailed mood description",
  "agentPerformance": {
    "professionalism": number(0-100),
    "helpfulness": number(0-100),
    "clarity": number(0-100)
  },
  "kpiAnalysis": {
    "strengths": [
      {
        "title": "string",
        "description": "string"
      }
    ],
    "improvements": [
      {
        "title": "string",
        "description": "string"
      }
    ]
  }
}
sentimentAnalysis total score of positive,negative,neutral should be 100
For KPI metrics evaluation, consider the following criteria:
${kpiMetricsPrompt}

For KPI strengths and improvements analysis:
1. Identify 3 key strengths based on high-scoring metrics and positive interactions
2. Identify 2 areas for improvement based on low-scoring metrics and opportunities for enhancement
3. Each strength and improvement should have a clear title and detailed description
4. Focus on actionable insights that can help improve future performance
`;
  } catch (error) {
    console.error('Error generating analysis prompt:', error);
    throw error;
  }
}

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
    
    // Get the dynamic analysis prompt
    const analysisPrompt = await getAnalysisPrompt();

    // Then, analyze the transcription using GPT-4
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: analysisPrompt
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
      agentPerformance: analysis.agentPerformance,
      kpiAnalysis: analysis.kpiAnalysis
    };
    console.log("DATA", data);
    return data;
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw new Error('Failed to analyze audio');
  }
}; 