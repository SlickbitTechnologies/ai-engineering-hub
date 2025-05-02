import { NextRequest, NextResponse } from 'next/server';
import { validateYouTubeURL } from '@/app/services/youtubeValidation';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({
                valid: false,
                error: 'URL parameter is required'
            }, { status: 400 });
        }

        // Validate the YouTube URL
        const validationResult = await validateYouTubeURL(url);

        if (!validationResult.valid) {
            return NextResponse.json(validationResult, { status: 422 });
        }

        return NextResponse.json(validationResult);
    } catch (error: any) {
        console.error('Error validating YouTube URL:', error);

        return NextResponse.json(
            { valid: false, error: error.message || 'Failed to validate YouTube URL' },
            { status: 500 }
        );
    }
}

// Increase timeout for this API route to allow for external API calls
export const maxDuration = 20; // seconds 