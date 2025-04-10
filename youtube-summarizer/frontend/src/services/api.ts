import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface Video {
  title: string;
  channel: string;
  channel_id: string;
  video_id: string;
  thumbnail: string;
  published_at: string;
  duration_seconds?: number;
  transcript_available: boolean;
  views: number;
  likes: number;
  comments: number;
  subscriber_count: number;
}

export interface SearchResponse {
  videos: Video[];
  message?: string;
}

export interface VideoSummary {
  video_id: string;
  title: string;
  summary: string;
  key_points: string[];
  action_items: string[];
  takeaways: string[];
  actionable_insights: string[];
}

export interface SummaryResponse {
  summaries: VideoSummary[];
  message?: string;
}

export const searchVideos = async (query: string, maxResults: number = 10, duration: string = 'any'): Promise<Video[]> => {
  try {
    // Ensure maxResults doesn't exceed the backend limit
    const safeMaxResults = Math.min(maxResults, 50);
    
    // Add a cache key based on the query parameters
    const cacheKey = `search-${query}-${safeMaxResults}-${duration}`;
    
    // Check if we have cached results
    const cachedResults = localStorage.getItem(cacheKey);
    if (cachedResults) {
      const { data, timestamp } = JSON.parse(cachedResults);
      // Use cache if it's less than 5 minutes old
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        console.log('Using cached search results');
        return data;
      }
    }
    
    // If no cache or cache expired, fetch from API
    const response = await axios.get(`${API_BASE_URL}/search-videos`, {
      params: {
        query,
        max_results: safeMaxResults,
        duration // Only pass the duration parameter
      }
    });
    
    const videos = response.data.videos;
    
    // If the backend returned a message, log it
    if (response.data.message) {
      console.log('Backend message:', response.data.message);
    }
    
    // Cache the results
    localStorage.setItem(cacheKey, JSON.stringify({
      data: videos,
      timestamp: Date.now()
    }));
    
    return videos;
  } catch (error) {
    console.error('Error searching videos:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
};

export const generateSummaries = async (
  videoIds: string[], 
  minWords: number = 500, 
  maxWords: number = 600
): Promise<{ summaries: VideoSummary[]; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/summarize-videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        video_ids: videoIds,
        min_words: minWords,
        max_words: maxWords
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate summaries');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating summaries:', error);
    throw error;
  }
}; 