// chatbot-backend/controllers/chatController.js
import path from 'path';
import url from 'url'; // Needed for __dirname equivalent
import { getLocalDocumentContent } from '../services/pdfService.mjs'; 
import { generateGeminiResponse } from '../services/geminiService.mjs'; 
import { replacePh } from '../utils/placeholderUtil.mjs';    
import CacheService from '../services/cacheService.js';

// ESM equivalent for __dirname
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths relative to the project root (which is one level up from controllers)
const LOCAL_DATA_FOLDER = "../pdfs"; // Relative path from controller file
const LOCAL_FAQ_PATH = path.resolve(__dirname, LOCAL_DATA_FOLDER, "faq.pdf");
const LOCAL_MENU_PATH = path.resolve(__dirname, LOCAL_DATA_FOLDER, "menu.pdf");
const LOCAL_CHAT_PATH = path.resolve(__dirname, LOCAL_DATA_FOLDER, "chat.pdf");
const LOCAL_DIALOGUE_PATH = path.resolve(__dirname, LOCAL_DATA_FOLDER, "dialogues.pdf");
const LOCAL_REVIEW_PATH = path.resolve(__dirname, LOCAL_DATA_FOLDER, "reviews.pdf");

export async function handleChatMessage(req, res) { // Use export keyword
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "No message provided" });
    }

    try {
        // Load context
       
        const {chosenContext, restaurantName, language} = await getContext(req.user.id, userMessage);
        // Generate response
        const rawReply = await generateGeminiResponse(chosenContext, userMessage, restaurantName, language);
        // console.log("CONTROLLER: Raw reply:", rawReply);
        // Apply placeholders
        const finalReply = replacePh(rawReply);

        res.json({ reply: finalReply });

    } catch (error) {
        console.error("Error in handleChatMessage:", error);
        res.status(500).json({
            error: "Internal server error processing chat message.",
            reply: replacePh("Sorry, something went wrong on my end. Please try again or call us at [Hypothetical Number, e.g., 98765 43210].")
        });
    }
}

const getContext = async (userId, userMessage) => {
    try {
        // Get context from cache/Firestore
        console.log("CONTROLLER: Getting context for user:", userId);
        const contextData = await CacheService.getContext(userId);
        
        // --- Context Selection Logic ---
        let chosenContext = "";
        
        if (contextData.faq) {
            chosenContext += `\n\nFAQ:\n${contextData.faq}`;
        }
        
        if (contextData.chatHistory) {
            chosenContext += `\n\nCHAT HISTORY:\n${contextData.chatHistory}`;
        }
        
        if (contextData.dialogue) {
            chosenContext += `\n\nCOMMONLY USED DIALOGUES:\n${contextData.dialogue}`;
        }
        
        if (contextData.reviews) {
            chosenContext += `\n\nGOOGLE REVIEWS:\n${contextData.reviews}`;
        }

        const inputLower = userMessage.toLowerCase();
        const menuKeywords = ['menu', 'price', 'cost', 'dhara', 'biryani', 'kebab', 'dish', 'item', 'food', 'veg', 'non-veg', 'starter', 'dessert', 'drink', 'beverage'];

        if (contextData.menu && menuKeywords.some(keyword => inputLower.includes(keyword))) {
            console.log("CONTROLLER: Prepending MENU context based on keywords.");
            chosenContext = `${chosenContext}\n\nMENU INFO:\n${contextData.menu}`;
        }

        if (!chosenContext && !contextData.menu) {
            console.error("CONTROLLER: No context could be loaded.");
            throw new Error("Sorry, I'm having trouble accessing my knowledge base right now. Please try calling us at [Hypothetical Number, e.g., 98765 43210].");
        }

        return {chosenContext, restaurantName: contextData.restaurantName, language: contextData.language};
    } catch (error) {
        console.error('Error getting context:', error);
        throw error;
    }
};