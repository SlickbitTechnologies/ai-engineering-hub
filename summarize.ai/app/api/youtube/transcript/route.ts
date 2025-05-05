import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from 'ytdl-core';
import fs from 'fs';
import { createReadStream } from 'fs';
import { OpenAI } from 'openai';
import path from 'path';
import os from 'os';

interface TranscriptSegment {
    startTime: number;
    endTime: number;
    text: string;
}

// Primary method: Use youtube-transcript package
async function fetchYoutubeTranscript(videoId: string): Promise<TranscriptSegment[]> {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        if (!transcript || transcript.length === 0) {
            // Fallback to audio transcription if no captions available
            return fetchAudioTranscript(videoId);
        }

        // Format transcript to match expected structure
        // The youtube-transcript package returns offset in seconds, so don't divide by 1000
        return transcript.map(({ offset, duration, text }: { offset: number, duration: number, text: string }) => ({
            startTime: offset, // already in seconds
            endTime: offset + duration, // already in seconds
            text: text
        }));
    } catch (error) {
        console.error('Error fetching transcript with youtube-transcript:', error);
        // Fallback to audio transcription
        return fetchAudioTranscript(videoId);
    }
}

// Fallback method: Use OpenAI Whisper for speech-to-text when no captions available
async function fetchAudioTranscript(videoId: string): Promise<TranscriptSegment[]> {
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const tempDir = os.tmpdir();
        const audioPath = path.join(tempDir, `${videoId}.mp3`);

        // 1. Download audio
        await new Promise<void>((resolve, reject) => {
            ytdl(videoUrl, { filter: 'audioonly', quality: 'lowestaudio' })
                .pipe(fs.createWriteStream(audioPath))
                .on('finish', () => resolve())
                .on('error', reject);
        });

        // 2. Send to Whisper via OpenAI
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const resp = await openai.audio.transcriptions.create({
            file: createReadStream(audioPath),
            model: 'whisper-1',
            response_format: 'verbose_json',
        });

        // Clean up the temp file
        fs.unlinkSync(audioPath);

        // Format response to match expected structure
        if (resp.segments) {
            return resp.segments.map(s => ({
                startTime: s.start,
                endTime: s.end,
                text: s.text.trim(),
            }));
        }

        // If no segments, create a single segment from the full transcription
        return [{
            startTime: 0,
            endTime: 0, // We don't know the end time
            text: resp.text
        }];
    } catch (error) {
        console.error('Error fetching audio transcript:', error);
        throw new Error('Unable to fetch transcript via any method');
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
        }

        // Extract video ID from URL
        const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (!videoId) {
            return NextResponse.json({ error: 'Invalid YouTube URL format' }, { status: 400 });
        }

        const transcript = await fetchYoutubeTranscript(videoId);

        return NextResponse.json({ transcript });
    } catch (error: any) {
        console.error('Error processing request:', error);

        return NextResponse.json(
            { error: 'TRANSCRIPT_NOT_AVAILABLE', message: error.message || 'Failed to fetch transcript' },
            { status: 500 }
        );
    }
}

// Maximum duration for this API route
export const maxDuration = 30; // seconds - increased to handle audio download and processing 