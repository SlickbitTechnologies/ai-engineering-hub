import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
    try {
        // Get form data with the audio file
        const formData = await request.formData();
        const audioFile = formData.get('file') as File;
        const customPrompt = formData.get('customPrompt') as string | null;

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Check file type
        const supportedFormats = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
            'audio/webm', 'audio/mp4', 'audio/aac', 'audio/m4a'
        ];

        if (!supportedFormats.includes(audioFile.type)) {
            return NextResponse.json(
                { error: 'Unsupported audio format. Please upload MP3, WAV, OGG, or other common audio formats.' },
                { status: 400 }
            );
        }

        // Step 1: Convert the audio file to a transcript using Whisper API
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        const transcriptionResponse = await openai.audio.transcriptions.create({
            file: new File([buffer], audioFile.name, { type: audioFile.type }),
            model: 'whisper-1',
        });

        const transcript = transcriptionResponse.text;

        if (!transcript || transcript.trim().length === 0) {
            return NextResponse.json(
                { error: 'Failed to transcribe audio. The file may not contain recognizable speech.' },
                { status: 422 }
            );
        }

        // Step 2: Summarize the transcript using OpenAI's chat completions
        const summaryResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert summarizer. Create a clear, concise summary of the provided transcript. Format the summary with markdown, using headers, bullet points, and sections as appropriate. Focus on key points and insights.'
                },
                {
                    role: 'user',
                    content: customPrompt
                        ? `${customPrompt}\n\nTranscript to summarize:\n\n${transcript}`
                        : `Please summarize the following transcript:\n\n${transcript}`
                }
            ],
            temperature: 0.5,
        });

        const summary = summaryResponse.choices[0]?.message.content || '';

        // Return both the transcript and summary
        return NextResponse.json({ transcript, summary });

    } catch (error: any) {
        console.error('Audio processing error:', error);

        return NextResponse.json(
            {
                error: 'Failed to process audio file',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Updated route segment config for Next.js App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set to 60 seconds for audio processing 