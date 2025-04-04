import express from "express";
import ViteExpress from "vite-express";
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
app.use(express.json());

// Initialize Gemini Pro
const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

app.get("/hello", (req, res) => {
  res.send("Hello Vite + React!");
});

app.post('/api/summarize/website', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch website content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.statusText}`);
    }
    
    const html = await response.text();

    // Extract main content
    const textContent = html.replace(/<[^>]*>/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim()
                           .slice(0, 4000);

    if (!textContent) {
      return res.status(400).json({ error: 'No content found to summarize' });
    }

    // Enhanced prompt for structured summary
    const prompt = `
      Please analyze the following web content and provide a structured summary with these sections:

      1. Main Topic/Title: A clear, concise title for the content
      2. Key Points: Write 3-5 key points as complete sentences without bullet points
      3. Brief Summary: A 2-3 sentence overview
      4. Important Details: Any specific numbers, dates, names, or statistics worth noting
      5. Conclusion: The main takeaway or conclusion

      Format the response in markdown with clear headings. Do not use bullet points or dashes; instead, use complete sentences in paragraph form.
      
      Web Content:
      ${textContent}
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1000,
      },
    });

    const response_text = await result.response.text();

    if (!response_text) {
      throw new Error('Failed to generate summary');
    }

    // Process the response to ensure proper formatting
    const formattedSummary = {
      url: url,
      timestamp: new Date().toISOString(),
      summary: response_text,
    };

    res.json(formattedSummary);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to summarize website',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

ViteExpress.listen(app, 3001, () =>
  console.log("Server is listening on port 3000..."),
);
