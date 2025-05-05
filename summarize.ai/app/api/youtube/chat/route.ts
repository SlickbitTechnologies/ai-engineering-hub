import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Helper function to format timestamp for readability
function formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Find most relevant transcript segments for a question
function findRelevantSegments(transcript: any[], question: string, maxSegments: number = 10): any[] {
    // Simple relevance scoring - in a production app you would use embeddings/semantic search
    const scoredSegments = transcript.map(segment => {
        // Count how many words from the question appear in this segment
        const questionWords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const segmentText = segment.text.toLowerCase();

        let score = 0;
        for (const word of questionWords) {
            if (segmentText.includes(word)) {
                score += 1;
            }
        }

        return { ...segment, relevanceScore: score };
    });

    // Sort by relevance score and take top segments
    return scoredSegments
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxSegments);
}

async function generateAnswer(transcript: any[], summary: string, question: string) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

        // Find most relevant transcript segments 
        const relevantSegments = findRelevantSegments(transcript, question);

        // Format relevant segments with timestamps
        const formattedSegments = relevantSegments.map(segment =>
            `[${formatTimestamp(segment.startTime)}] ${segment.text}`
        ).join('\n\n');

        const prompt = `
      You are an AI assistant that answers questions about YouTube videos. 
      You have been provided with a summary and relevant transcript segments of a video.
      
      Here is the summary of the video:
      ${summary}
      
      Here are the most relevant transcript segments with timestamps:
      ${formattedSegments}
      
      Please answer the following question based on the video content:
      ${question}
      
      Requirements:
      1. If you cannot answer the question based on the provided content, please state that clearly.
      2. Provide a concise, accurate response based only on the information available in the video.
      3. When referring to specific content, include the timestamp [MM:SS] to help the user find that part in the video.
      4. Keep your answer focused and helpful.
    `;

        const result = await model.generateContent(prompt);
        const textResult = result.response.text();

        return textResult;
    } catch (error) {
        console.error('Error generating answer:', error);
        throw new Error('Failed to generate answer');
    }
}

export async function POST(request: NextRequest) {
    try {
        const { transcript, summary, question } = await request.json();

        if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
            return NextResponse.json({ error: 'Valid transcript array is required' }, { status: 400 });
        }

        if (!summary || typeof summary !== 'string') {
            return NextResponse.json({ error: 'Valid summary is required' }, { status: 400 });
        }

        if (!question || typeof question !== 'string') {
            return NextResponse.json({ error: 'Valid question is required' }, { status: 400 });
        }

        const answer = await generateAnswer(transcript, summary, question);

        return NextResponse.json({ answer });
    } catch (error: any) {
        console.error('Error processing chat request:', error);

        return NextResponse.json(
            { error: 'ANSWER_GENERATION_FAILED', message: error.message || 'Failed to generate answer' },
            { status: 500 }
        );
    }
}

// Maximum duration for this API route
export const maxDuration = 30; // seconds 