import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Initialize OpenAI as a fallback
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Rate limiting parameters
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds
let geminiUsageCount = 0;
const GEMINI_QUOTA_RESET_TIME = 60000; // 1 minute in milliseconds
let lastGeminiReset = Date.now();

// Helper function to estimate tokens in a text string (rough estimation)
function estimateTokens(text: string): number {
    // A very rough estimate: 1 token is approx 4 chars for English text
    return Math.ceil(text.length / 4);
}

// Helper function for delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Split transcript into chunks that fit within model's context window
function chunkTranscript(segments: any[], maxTokens: number = 8000): string[] {
    const chunks: string[] = [];
    let current: any[] = [];
    let tokenCount = 0;

    for (let seg of segments) {
        const segTokens = estimateTokens(seg.text);

        if (tokenCount + segTokens > maxTokens) {
            // Add the current chunk to chunks and start a new one
            chunks.push(current.map(s => s.text).join(' '));
            current = [seg];
            tokenCount = segTokens;
        } else {
            current.push(seg);
            tokenCount += segTokens;
        }
    }

    // Add the final chunk if there's anything left
    if (current.length) {
        chunks.push(current.map(s => s.text).join(' '));
    }

    return chunks;
}

// Check if we should use Gemini or switch to fallback
function shouldUseGemini(): boolean {
    const currentTime = Date.now();

    // Reset counter if it's been more than a minute since the last reset
    if (currentTime - lastGeminiReset > GEMINI_QUOTA_RESET_TIME) {
        geminiUsageCount = 0;
        lastGeminiReset = currentTime;
        return true;
    }

    // If we're below the usage threshold, use Gemini
    if (geminiUsageCount < 2) { // Gemini has a limit of 2 requests per minute in free tier
        geminiUsageCount++;
        return true;
    }

    return false;
}

// Generic function to generate AI content with retries and fallbacks
async function generateWithRetry(prompt: string, type: 'summary' | 'highlights'): Promise<string> {
    let retries = 0;

    while (retries <= MAX_RETRIES) {
        try {
            // Check if we should use Gemini or switch to fallback
            if (shouldUseGemini()) {
                // Try with Gemini
                console.log(`Using Gemini for ${type}, attempt ${retries + 1}`);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
                const result = await model.generateContent(prompt);
                return result.response.text();
            } else {
                // Use OpenAI as fallback
                console.log(`Using OpenAI for ${type} (Gemini quota reached)`);
                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                });
                return completion.choices[0]?.message?.content || "Error generating content";
            }
        } catch (error: any) {
            console.error(`Error in ${type} generation, attempt ${retries + 1}:`, error);

            // If rate limited, wait and retry
            if (error.status === 429) {
                retries++;
                if (retries <= MAX_RETRIES) {
                    console.log(`Rate limited, retrying in ${RETRY_DELAY}ms`);
                    await sleep(RETRY_DELAY * retries); // Exponential backoff
                    continue;
                }

                // If we're out of retries with Gemini, try OpenAI
                try {
                    console.log('Falling back to OpenAI after Gemini rate limit');
                    const completion = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: prompt }],
                    });
                    return completion.choices[0]?.message?.content || "Error generating content";
                } catch (openaiError) {
                    console.error('OpenAI fallback also failed:', openaiError);
                    throw new Error('All AI models failed to generate content');
                }
            } else {
                // For other errors, retry once then give up
                retries++;
                if (retries <= 1) {
                    await sleep(RETRY_DELAY);
                    continue;
                }
                throw error;
            }
        }
    }

    throw new Error('Maximum retries exceeded');
}

async function generateSummaryForChunk(transcript: string) {
    const prompt = `
    You are an expert YouTube video summarizer. I will provide you with a transcript of a YouTube video.
    Please analyze this transcript and provide a clear, concise summary that captures the main points and purpose of the video.
    
    Here's the transcript:
    
    ${transcript}
    `;

    return generateWithRetry(prompt, 'summary');
}

async function generateHighlightsAndKeypoints(transcript: string) {
    const prompt = `
    You are an expert YouTube video summarizer. I will provide you with a transcript of a YouTube video.
    Please analyze this transcript and provide:
    
    1. A list of 5-7 key highlights from the video.
    2. A list of 5 short, snappy key insights from the video.
    
    Format your response as a JSON object with the following structure:
    {
      "highlights": ["Highlight 1", "Highlight 2", ...],
      "keypoints": ["Key point 1", "Key point 2", ...]
    }
    
    Only respond with the JSON object, no additional text. Here's the transcript:
    
    ${transcript}
    `;

    try {
        const result = await generateWithRetry(prompt, 'highlights');

        // Find the JSON in the response (sometimes the model wraps the JSON in code blocks)
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        // If no JSON is found, create a basic structure
        return {
            highlights: ["Unable to parse highlights from AI response"],
            keypoints: ["Unable to parse key points from AI response"]
        };
    } catch (error) {
        console.error('Error generating highlights and keypoints:', error);
        return {
            highlights: ["Could not generate highlights due to API limitations"],
            keypoints: ["Could not generate key points due to API limitations"]
        };
    }
}

async function generateSummary(transcript: any[]) {
    // Check if we have a valid transcript
    if (!transcript || transcript.length === 0) {
        throw new Error('Invalid or empty transcript');
    }

    try {
        // 1. Split transcript into chunks if needed
        const transcriptChunks = chunkTranscript(transcript);

        // 2. Generate summary for first chunk only to avoid rate limits
        // This is a compromise to ensure we get at least some summary
        const firstChunkSummary = await generateSummaryForChunk(transcriptChunks[0]);

        let finalSummary = firstChunkSummary;

        // 3. Generate highlights and keypoints from the first chunk only
        // This reduces the number of API calls while still providing useful content
        const extraData = await generateHighlightsAndKeypoints(transcriptChunks[0]);

        return {
            summary: finalSummary,
            highlights: extraData.highlights,
            keypoints: extraData.keypoints
        };
    } catch (error) {
        console.error('Error in complete summary generation:', error);
        throw new Error('Failed to generate complete summary');
    }
}

export async function POST(request: NextRequest) {
    try {
        const { transcript } = await request.json();
        if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
            return NextResponse.json({ error: 'Valid transcript array is required' }, { status: 400 });
        }

        // Generate summary using the AI model
        const summaryData = await generateSummary(transcript);

        return NextResponse.json({
            summary: summaryData.summary,
            highlights: summaryData.highlights,
            keypoints: summaryData.keypoints
        });
    } catch (error: any) {
        console.error('Error processing summary request:', error);

        // Provide a useful message for quota errors
        if (error.message?.includes('quota') || error.status === 429) {
            return NextResponse.json(
                {
                    error: 'API_QUOTA_EXCEEDED',
                    message: 'AI service quota exceeded. Please try again later.'
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'SUMMARY_GENERATION_FAILED', message: error.message || 'Failed to generate summary' },
            { status: 500 }
        );
    }
}

// Maximum duration for this API route
export const maxDuration = 60; // seconds - increased to handle complex processing 