import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Map of language codes to names for better prompting
const languageNames: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'nl': 'Dutch',
    'tr': 'Turkish',
    'pl': 'Polish',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'te': 'Telugu'
};

export async function POST(request: NextRequest) {
    try {
        // Get text and language info from request
        const { text, sourceLanguage, targetLanguage } = await request.json();

        // Validate input
        if (!text || text.trim() === '') {
            return NextResponse.json({
                error: 'Please provide text to translate'
            }, { status: 400 });
        }

        if (!targetLanguage) {
            return NextResponse.json({
                error: 'Target language is required'
            }, { status: 400 });
        }

        // Get full language names for better prompting
        const targetLangName = languageNames[targetLanguage] || targetLanguage;
        const sourceLangName = sourceLanguage && sourceLanguage !== 'auto' ?
            (languageNames[sourceLanguage] || sourceLanguage) : null;

        // Create prompt based on detected source language
        let systemPrompt = 'You are a professional translator with expertise in multiple languages including Telugu and other Indian languages.';

        if (sourceLangName) {
            systemPrompt += ` Translate the following text from ${sourceLangName} to ${targetLangName}.`;
        } else {
            systemPrompt += ` Translate the following text to ${targetLangName}.`;
        }

        systemPrompt += ' Preserve the meaning, tone, and style of the original text. Only respond with the translated text, without explanations or additional content.';

        // Use OpenAI for translation
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.1
        });

        // Extract translated text
        const translatedText = response.choices[0]?.message.content || '';

        return NextResponse.json({ translatedText });

    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Failed to translate text' },
            { status: 500 }
        );
    }
} 