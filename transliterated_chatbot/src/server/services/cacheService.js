import admin from 'firebase-admin';
import pdfParse from 'pdf-parse';
import fetch from 'node-fetch';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const storage = admin.storage();

// In-memory cache with TTL (Time To Live)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

async function readPdfFromUrl(url) {
  try {
    console.log('Reading PDF from URL:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    const data = await pdfParse(buffer);
    console.log('PDF content:', data.text);
    return data.text;
  } catch (error) {
    console.error('Error reading PDF:', error);
    return '';
  }
}

class CacheService {
  static async getContext(userId) {
    const cacheKey = `context_${userId}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log('Cache hit for user:', userId);
      return cachedData.data;
    }

    try {
      const restaurantDoc = await db.collection('restaurants').doc(userId).get();
    
      if (!restaurantDoc.exists) {
        throw new Error('Files not found');
      }

      const restaurantDocData = restaurantDoc.data();
      
      // Read PDF files if they exist
      const pdfContents = await Promise.all([
        restaurantDocData.files?.faqs ? readPdfFromUrl(restaurantDocData.files.faqs) : '',
        restaurantDocData.files?.menu ? readPdfFromUrl(restaurantDocData.files.menu) : '',
        restaurantDocData.files?.history ? readPdfFromUrl(restaurantDocData.files.history) : '',
        restaurantDocData.files?.reviews ? readPdfFromUrl(restaurantDocData.files.reviews) : ''
      ]);

      const contextData = {
        faq: pdfContents[0],
        menu: pdfContents[1],
        chatHistory: pdfContents[2],
        reviews: pdfContents[3],
        timestamp: Date.now(),
        restaurantName: restaurantDocData.name,
        language: restaurantDocData.language
      };

      // Update cache
      cache.set(cacheKey, {
        data: contextData,
        timestamp: Date.now()
      });
      console.log('Cache:', contextData);
      console.log('Cache miss for user:', userId, 'Updated cache with PDF contents');
      return contextData;
    } catch (error) {
      console.error('Error fetching context from Firestore:', error);
      throw error;
    }
  }

  static clearCache(userId) {
    const cacheKey = `context_${userId}`;
    cache.delete(cacheKey);
    console.log('Cache cleared for user:', userId);
  }

  static async updateContext(userId, contextData) {
    try {
      await db.collection('users').doc(userId).update(contextData);
      this.clearCache(userId); // Clear cache after update
      console.log('Context updated for user:', userId);
    } catch (error) {
      console.error('Error updating context in Firestore:', error);
      throw error;
    }
  }
}

export default CacheService; 