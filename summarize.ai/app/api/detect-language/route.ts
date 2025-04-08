import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Language code mapping for common languages
const languageCodes: Record<string, string> = {
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'russian': 'ru',
    'chinese': 'zh',
    'japanese': 'ja',
    'korean': 'ko',
    'arabic': 'ar',
    'hindi': 'hi',
    'dutch': 'nl',
    'turkish': 'tr',
    'polish': 'pl',
    'vietnamese': 'vi',
    'thai': 'th',
    'telugu': 'te'
};

export async function POST(request: NextRequest) {
    try {
        // Get text from request
        const { text } = await request.json();

        // Validate input
        if (!text || text.trim().length < 5) {
            return NextResponse.json({
                error: 'Please provide at least 5 characters for language detection'
            }, { status: 400 });
        }

        // Truncate text if too long (to save tokens)
        const truncatedText = text.length > 500 ? text.substring(0, 500) : text;

        // Use OpenAI to detect language
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are a language detection specialist. Analyze the provided text and identify what language it is written in. Return ONLY the language name in lowercase English (e.g., "english", "spanish", "french", "telugu", etc.) without any additional text, punctuation, or explanations.'
                },
                {
                    role: 'user',
                    content: truncatedText
                }
            ],
            temperature: 0.1,
            max_tokens: 10,
        });

        // Extract detected language
        const detectedLanguage = response.choices[0]?.message.content?.toLowerCase().trim() || '';

        console.log("Detected language:", detectedLanguage);

        // Map to language code
        const languageCode = languageCodes[detectedLanguage] || detectedLanguage;

        return NextResponse.json({ language: languageCode });

    } catch (error) {
        console.error('Language detection error:', error);
        return NextResponse.json(
            { error: 'Failed to detect language' },
            { status: 500 }
        );
    }
} 