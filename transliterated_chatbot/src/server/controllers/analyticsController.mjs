import { getRestaurantData } from '../services/cacheService.mjs';
import { analyzeSentiment } from '../services/geminiService.mjs';
import cache from '../services/cacheService.mjs';

// Get overall sentiment analysis
export const getSentimentAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting sentiment analysis for user:', userId);

    // Check cache first
    const cacheKey = `sentiment_${userId}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached sentiment analysis',cachedData);
      return res.json(cachedData);
    }

    // If not in cache, fetch from Firestore
    const restaurantData = await getRestaurantData(userId);
   

    if (!restaurantData) {
      return res.status(404).json({ error: 'Restaurant data not found' });
    }
    const {history, reviews} = restaurantData.files;
    // Check if we have the required files
    if (!history || !reviews) {
      return res.status(404).json({ error: 'Required files not found' });
    }

    // Process the data using Gemini
    const analysis = await analyzeSentiment(history, reviews);
    console.log('Analysis result:', analysis);

    // Format the response
    const response = {
      sentimentData: {
        foodQuality: analysis.foodQuality,
        service: analysis.service,
        ambiance: analysis.ambiance,
        overallSentiment: analysis.overallSentiment
      },
      analyticsSummary: {
        totalReviews: analysis.totalReviews,
        averageRating: analysis.averageRating,
        responseRate: analysis.responseRate,
        satisfactionScore: analysis.satisfactionScore
      },
      detailedData: {
        topDishes: analysis.topDishes,
        commonPhrases: analysis.commonPhrases,
        improvement: analysis.improvement,
        totalInteractions: analysis.totalInteractions,
        averageResponseTime: analysis.averageResponseTime,
        topKeywords: analysis.topKeywords,
        sentimentTrend: analysis.sentimentTrend,
        summary: analysis.summary
      }
    };

    // Cache the response for 1 hour
    cache.set(cacheKey, response);
    console.log('Cached sentiment analysis for user:', userId);

    res.json(response);
  } catch (error) {
    console.error('Error in getSentimentAnalysis:', error);
    res.status(500).json({ error: 'Failed to get sentiment analysis' });
  }
}; 