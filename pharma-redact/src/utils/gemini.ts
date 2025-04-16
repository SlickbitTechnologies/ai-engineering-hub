import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Get the preferred model (gemini-2.0-flash)
export const getGeminiModel = (modelName: string = 'gemini-2.0-flash') => {
    return genAI.getGenerativeModel({ model: modelName });
};

// For development debugging
if (process.env.NODE_ENV === 'development') {
    console.log('Gemini API client initialized');
    console.log('Gemini API key exists:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
}

export default genAI; 