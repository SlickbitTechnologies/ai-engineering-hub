import OpenAI from 'openai';

// Initialize the OpenAI API client with the API key from environment variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// For development debugging
if (process.env.NODE_ENV === 'development') {
    console.log('OpenAI API client initialized');
    console.log('OpenAI API key exists:', !!process.env.OPENAI_API_KEY);
}

export default openai; 