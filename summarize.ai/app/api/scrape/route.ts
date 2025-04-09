import { NextResponse } from 'next/server';
import { summarizeContent } from '@/app/lib/gemini';

// Validate URL
function isValidUrl(urlString: string) {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

// Simple fallback summarization
function fallbackSummarize(content: string): string {
    try {
        // Extract sentences
        const sentences = content.split(/[.!?]+/).filter(Boolean).map(s => s.trim());
        if (sentences.length <= 3) return content;

        // Take first two sentences and last sentence
        return [
            ...sentences.slice(0, 2),
            sentences[sentences.length - 1]
        ].join('. ') + '.';
    } catch (err) {
        console.error('Error in fallback summarization:', err);
        return "We were unable to generate a summary. Please try a different URL.";
    }
}

// Simple fetch content function using native fetch API
async function fetchContent(url: string) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();

        // Very basic HTML to text conversion
        const text = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return text;
    } catch (error) {
        console.error('Error fetching content:', error);
        throw error;
    }
}

export async function POST(req: Request) {
    try {
        const { url, customPrompt } = await req.json();

        // Validate the URL
        if (!url || !isValidUrl(url)) {
            return NextResponse.json(
                { error: 'Invalid URL. Please provide a valid HTTP or HTTPS URL.' },
                { status: 400 }
            );
        }

        try {
            // Extract content from the webpage
            const content = await fetchContent(url);

            // Check if we have enough content to summarize
            if (!content || content.length < 200) {
                return NextResponse.json(
                    {
                        summary: "This appears to be a very short page or we couldn't extract meaningful content. Please try a different URL with more textual content."
                    }
                );
            }

            try {
                // Try to use Gemini API for summarization
                console.log(`Generating summary for content of length: ${content.length}`);
                const summary = await summarizeContent(content, undefined, customPrompt);

                // Check if the summary is actually meaningful
                if (!summary || summary.includes('API is currently unavailable')) {
                    console.warn('Gemini API failed, using fallback summarization');
                    const fallbackSummary = fallbackSummarize(content);
                    return NextResponse.json({
                        summary: fallbackSummary,
                        note: "This summary was generated using our fallback system as the AI service is currently unavailable."
                    });
                }

                return NextResponse.json({ summary });

            } catch (summaryError) {
                // If Gemini API fails, use fallback summarization
                console.error('Error with summarization:', summaryError);
                const fallbackSummary = fallbackSummarize(content);
                return NextResponse.json({
                    summary: fallbackSummary,
                    note: "This summary was generated using our fallback system as the AI service is currently unavailable."
                });
            }

        } catch (error: any) {
            console.error('Scraping error:', error);

            return NextResponse.json(
                {
                    summary: "We encountered an issue accessing this webpage. The site may not allow scraping or the URL might be incorrect. Try a different website or check your URL."
                }
            );
        }

    } catch (error) {
        console.error('Request processing error:', error);
        return NextResponse.json(
            { error: 'Failed to process request.' },
            { status: 400 }
        );
    }
} 