import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
    try {
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

        // Return the summary
        return NextResponse.json({ summary });
    } catch (error: any) {
        console.error('Text summarization error:', error);

        return NextResponse.json(
            {
                error: 'Failed to summarize text',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Updated route segment config for Next.js App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds for text summarization 