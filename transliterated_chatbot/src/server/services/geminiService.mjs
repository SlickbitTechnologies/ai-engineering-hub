// chatbot-backend/services/geminiService.js
import dotenv from 'dotenv';
dotenv.config(); // Load env vars

// Use named imports for classes/enums
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getPlaceholder } from '../utils/placeholderUtil.mjs'; // Add .js extension
import { getStorageFileContent } from './storageService.mjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// const MODEL ='gemini-2.5-pro-exp-03-25'
const MODEL ='gemini-2.0-flash'
let genAI;
let geminiModel;
let isGeminiInitialized = false;

if (!GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set. Gemini functionality disabled.");
} else {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        geminiModel = genAI.getGenerativeModel({ model:MODEL });
        console.log("Gemini model initialized successfully.");
        isGeminiInitialized = true;
    } catch (error) {
        console.error("Failed to initialize Gemini:", error);
        geminiModel = null;
    }
}

const generationConfig = {
    temperature: 0.7,
    topK: 1,
    topP: 1,
};

const safetySettings = [
     { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
     { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
     { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
     { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
];

export async function generateGeminiResponse(context, userQuery, restaurantName, language) {
    console.log("API KEY:", GEMINI_API_KEY);
     if (!isGeminiInitialized || !geminiModel) {
         console.error("Gemini model not available for response generation.");
         return `Sorry, the AI model is currently unavailable. Please try again later or call ${getPlaceholder("[Hypothetical Number, e.g., 98765 43210]")}.`;
     }

     
     const contactNumber = getPlaceholder("[Hypothetical Number, e.g., 98765 43210]", "our contact number");
     const BOT_NAME = `${restaurantName} Bot`;
     // Prompt remains the same...
     const prompt = `You are a helpful, friendly customer support assistant for a restaurant called "${restaurantName}". Your name is ${BOT_NAME}.
You MUST answer customer questions based *ONLY* on the information provided in the 'CONTEXT' section below.
If the answer cannot be found or inferred *directly* from the CONTEXT, you MUST explicitly state that you don't have that specific information and suggest asking staff or calling the restaurant at ${contactNumber}. 
Do not make up information or answer general knowledge questions.
You must respond in a mix of conversational transliterated ${language}, mirroring a helpful support style (e.g., "Avunu andi", "konchem", "ekkada", "price enti?"). Keep responses concise and directly address the user's question.
You must behave as a human assistant, not a bot.For example, user asked ela vunnavu, you must respond with "Nenu bagunnanu, meru ela vunnaru"
Responses must be respectful and polite.
Respond in a mix of conversational English and transliterated ${language}, mirroring a helpful support style (e.g., "Avunu andi", "konchem", "ekkada", "price enti?"). Keep responses concise and directly address the user's question.

CONTEXT:
--- Start of Context ---
${context || "No context information available."}
--- End of Context ---

USER QUESTION: ${userQuery}

XYZBot Answer:
`;

     try {
         console.log("Sending request to Gemini...");
         const result = await geminiModel.generateContent(
            prompt,
            generationConfig, // Pass config if defined
            safetySettings   // Pass safety settings
         );
         const response = result.response;

         if (response.promptFeedback?.blockReason) {
              console.warn("Gemini response blocked:", response.promptFeedback.blockReason);
              return `Sorry, I couldn't generate a response based on the provided information, possibly due to content policies (${response.promptFeedback.blockReason}). Please rephrase or contact us directly at ${contactNumber}.`;
         }

         const text = response.text();
         console.log("Received response from Gemini.");
         return text;
     } catch (error) {
         console.error("Error calling Gemini API:", error);
         return `Sorry, there was an error communicating with the AI model. Please try again later or call us at ${contactNumber}.`;
     }
}

export const isGeminiReady = () => isGeminiInitialized;

export const analyzeSentiment = async (historyUrl, reviewsUrl) => {
  try {
    // Get file contents from Firebase Storage
    // const historyContent = await getStorageFileContent(historyUrl);
    // const reviewsContent = await getStorageFileContent(reviewsUrl);
    const [historyContent, reviewsContent] = await Promise.all([getStorageFileContent(historyUrl), getStorageFileContent(reviewsUrl)]);
   
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: MODEL });
    const generationConfig = {
      temperature: 1,
      responseMimeType: "application/json",
    }
    // Create prompt for sentiment analysis
    const prompt = `
      Analyze the following restaurant data and provide a detailed sentiment analysis in JSON format:
      
      History Data:
      ${historyContent}
      
      Reviews Data:
      ${reviewsContent}
      
      Please provide analysis in the following JSON structure:
      {
        "foodQuality": { "positive": number, "neutral": number, "negative": number },
        "service": { "positive": number, "neutral": number, "negative": number },
        "ambiance": { "positive": number, "neutral": number, "negative": number },
        "overallSentiment": "string",
        "totalReviews": number,
        "averageRating": number,
        "responseRate": "string",
        "topDishes": ["string"],
        "commonPhrases": ["string"],
        "improvement": ["string"],
        "totalInteractions": number,
        "averageResponseTime": "string",
        "satisfactionScore": number,
        "topKeywords": ["string"],
        "sentimentTrend": [
          { "date": "string", "positive": number, "neutral": number, "negative": number }
        ]
      }

      foodQuality,service,ambiance are in percentage
    `;

    // Get response from Gemini
    const result = await model.generateContent(prompt,generationConfig);
    const response = await result.response;
    // console.log("response", JSON.stringify(response.candidates));
    const text = response.text();
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
    console.log("text", cleanedText);
    // Parse the JSON response
    const analysis = JSON.parse(cleanedText);
    
    return analysis;
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    throw error;
  }
};