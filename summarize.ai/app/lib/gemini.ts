import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Get API key considering both server and client environments
const getApiKey = () => {
    // Server-side: process.env
    // Client-side: process.env.NEXT_PUBLIC_*
    console.log('Checking for Gemini API key');
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
        console.error('⚠️ No Gemini API key found in environment variables');
    } else {
        console.log('✓ Gemini API key found');
    }

    return apiKey;
};

// Create a function to get the model - lazy initialization
const getGeminiModel = () => {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error('API key for Gemini is not configured. Please add GEMINI_API_KEY to your environment variables.');
    }

    // Initialize the API with the key
    const geminiApi = new GoogleGenerativeAI(apiKey);
    console.log('Gemini API initialized with model: gemini-1.5-flash');

    // Return the model - using the correct model name
    // Note: API has been updated so we're using 'gemini-1.5-flash' (newer model)
    return geminiApi.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

/**
 * Generate text using Gemini model
 * @param prompt - The prompt to generate text from
 * @returns The generated text
 */
export async function generateText(prompt: string): Promise<string> {
    try {
        console.log('Generating text with Gemini API');
        // Get the API key
        const apiKey = getApiKey();

        // Check if API key is available
        if (!apiKey) {
            console.error('No Gemini API key provided');
            throw new Error('API key for Gemini is not configured');
        }

        // Get the model
        const model = getGeminiModel();

        console.log('Sending prompt to Gemini API');
        // Generate content with safety settings
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                }
            ]
        });

        const response = await result.response;
        const responseText = response.text();
        console.log('Successfully received response from Gemini API');
        return responseText;
    } catch (error: any) {
        console.error('Error generating text with Gemini:', error);

        // Provide fallback for when API fails
        if (error.message?.includes('404') || error.message?.includes('Not Found')) {
            console.warn('Gemini API model not found. Using fallback summarization.');
            return 'The API is currently unavailable. Please try again later or check your API key configuration.';
        }

        throw error;
    }
}

/**
 * Summarize content using Gemini model
 * @param content - The content to summarize
 * @param maxLength - Optional maximum length of the summary
 * @param customPrompt - Optional custom prompt to override the default summarization instructions
 * @returns The summarized text
 */
export async function summarizeContent(content: string, maxLength?: number, customPrompt?: string): Promise<string> {
    try {
        console.log(`Summarizing content of length: ${content.length} characters`);

        if (!content || content.trim().length < 100) {
            console.warn('Content too short to summarize properly');
            return "The provided content is too short to generate a meaningful summary.";
        }

        // Trim content if it's too long to avoid hitting API limits
        const trimmedContent = content.length > 30000
            ? content.substring(0, 30000) + '...'
            : content;

        let prompt;

        if (customPrompt && customPrompt.trim()) {
            // Use the custom prompt if provided
            prompt = `The following is content from a document. ${customPrompt.trim()}

Here's the content:
            
${trimmedContent}`;
        } else {
            // Use the default summarization prompt
            prompt = `Please provide a detailed but concise summary of the following content. 

Format your summary with:
1. A brief overview section at the beginning
2. Multiple sub-headings (using ## format) to organize key topics
3. Bullet points (using - format) to highlight important points under each section
4. Include relevant details but avoid unnecessary information
5. Keep paragraphs brief and focused

The summary should be comprehensive but not excessively long, approximately 400-600 words total.

Here's the content to summarize:
    
${trimmedContent}`;
        }

        if (maxLength) {
            prompt += `\n\nPlease keep the summary under ${maxLength} words total.`;
        }

        const summary = await generateText(prompt);
        console.log(`Summary generation complete, received ${summary.length} characters`);
        return summary;
    } catch (error: any) {
        console.error('Error in summarizeContent:', error);

        // Simple fallback summarization when the API fails
        console.warn('Using fallback summarization method');
        const sentences = content.split(/[.!?]+/).filter(Boolean).map(s => s.trim());
        if (sentences.length <= 3) return content;

        // Take first, middle and last sentence
        return [
            sentences[0],
            sentences[Math.floor(sentences.length / 2)],
            sentences[sentences.length - 1]
        ].join('. ') + '.';
    }
}

/**
 * Translate content using Gemini model
 * @param content - The content to translate
 * @param targetLanguage - The language to translate to
 * @returns The translated text
 */
export async function translateContent(content: string, targetLanguage: string): Promise<string> {
    try {
        // Trim content if it's too long
        const trimmedContent = content.length > 30000
            ? content.substring(0, 30000) + '...'
            : content;

        const prompt = `Please translate the following content into ${targetLanguage}:
    
${trimmedContent}`;

        return await generateText(prompt);
    } catch (error: any) {
        console.error('Error in translateContent:', error);
        return `Translation failed: ${error.message}`;
    }
} 