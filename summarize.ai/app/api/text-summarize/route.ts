import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkAndUpdateQuota } from '@/app/lib/quotaMiddleware';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
    try {
        // Check quota first
        const quotaResult = await checkAndUpdateQuota(request);
        if (quotaResult instanceof NextResponse) {
            return quotaResult; // This is an error response
        }

        // Get the text content from the request
        const { text, customPrompt } = await request.json();

        // Validate input
        if (!text || text.trim().length < 100) {
            return NextResponse.json(
                { error: 'Please provide at least 100 characters for a meaningful summary' },
                { status: 400 }
            );
        }

        // Generate a summary using OpenAI's chat completions
        const summaryResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert summarizer. Create a clear, concise summary of the provided text. Format the summary with markdown, using headers, bullet points, and sections as appropriate. Focus on key points and insights.'
                },
                {
                    role: 'user',
                    content: customPrompt
                        ? `${customPrompt}\n\nText to summarize:\n\n${text}`
                        : `Please summarize the following text:\n\n${text}`
                }
            ],
            temperature: 0.5,
        });

        const summary = summaryResponse.choices[0]?.message.content || '';

        // Include quota information in the response if available
        const quotaInfo = quotaResult?.quotaInfo;
        console.log('Quota info from middleware:', quotaInfo);

        // Return the summary with quota information
        return NextResponse.json({
            summary,
            quota: quotaInfo || null
        });
    } catch (error: any) {
        console.error('Text summarization error:', error);

        return NextResponse.json(
            { error: 'Failed to summarize text', message: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

// Updated route segment config for Next.js App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds for text summarization 