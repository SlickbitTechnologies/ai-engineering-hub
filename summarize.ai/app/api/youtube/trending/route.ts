import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { extractVideoId } from '@/app/services/youtubeValidation';

// Store the API key to make it accessible to the route
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBeq2PoEuISo7OA2VkfDq5e2woe4Wlxpro';

// Initialize the YouTube API client
const youtube = google.youtube({
    version: 'v3',
    auth: YOUTUBE_API_KEY
});

// Relevant categories to filter trending videos
const RELEVANT_KEYWORDS = [
    'self-help', 'science', 'history', 'biography', 'math', 'mathematics',
    'experiments', 'technology', 'AI', 'artificial intelligence', 'coding',
    'programming', 'teaching', 'education', 'learn'
];

// Criteria for trending videos
const MIN_VIEW_COUNT = 100000;         // 100K views minimum
const MAX_VIDEO_DURATION = 5400;       // Max 90 minutes (in seconds)

// Define a type for trending videos
type TrendingVideo = {
    videoId: string;
    title: string;
    thumbnailUrl: string;
    channelName: string;
    viewCount: string;
};

// Check if a video title or description contains relevant categories
function isRelevantVideo(title: string, description: string): boolean {
    const content = (title + ' ' + description).toLowerCase();
    return RELEVANT_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()));
}

// Format view count to human readable format (e.g. 1.2M, 5.7K)
function formatViewCount(count: number): string {
    if (count >= 1000000000) {
        return (count / 1000000000).toFixed(1) + 'B views';
    } else if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M views';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K views';
    } else {
        return count + ' views';
    }
}

// Parse ISO 8601 duration format to seconds
function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
}

// Simplified validation for trending videos - done in-memory without extra API calls
function isTrendingVideoValid(video: any): boolean {
    try {
        // Check video has required data
        if (!video.id || !video.snippet || !video.statistics || !video.contentDetails) {
            return false;
        }

        // Check view count
        const viewCount = parseInt(video.statistics.viewCount || '0');
        if (viewCount < MIN_VIEW_COUNT) {
            return false;
        }

        // Check video duration
        const durationSecs = parseISO8601Duration(video.contentDetails.duration || '');
        if (durationSecs > MAX_VIDEO_DURATION || durationSecs === 0) {
            return false;
        }

        // Check if title/description are relevant
        if (!isRelevantVideo(video.snippet.title || '', video.snippet.description || '')) {
            return false;
        }

        return true;
    } catch (error) {
        console.warn('Error validating trending video', video.id, error);
        return false;
    }
}

// Fetch trending videos from YouTube without specifying category
async function fetchGeneralTrendingVideos(): Promise<TrendingVideo[]> {
    try {
        console.log('Fetching general trending videos');
        const response = await youtube.videos.list({
            part: ['snippet', 'statistics', 'contentDetails'],
            chart: 'mostPopular',
            regionCode: 'US',
            maxResults: 50 // Get more to filter
        });

        if (!response.data.items || response.data.items.length === 0) {
            console.log('No general trending videos found');
            return [];
        }

        console.log(`Found ${response.data.items.length} general trending videos`);

        // Filter and validate videos
        const validVideos = response.data.items
            .filter(isTrendingVideoValid)
            .map(video => ({
                videoId: video.id || '',
                title: video.snippet?.title || '',
                thumbnailUrl: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url || '',
                channelName: video.snippet?.channelTitle || '',
                viewCount: formatViewCount(parseInt(video.statistics?.viewCount || '0'))
            } as TrendingVideo));

        console.log(`${validVideos.length} valid trending videos after filtering`);
        return validVideos;
    } catch (error) {
        console.error('Error fetching general trending videos:', error);
        return [];
    }
}

// Search for videos by relevant keywords
async function searchRelevantVideos(): Promise<TrendingVideo[]> {
    const allResults: TrendingVideo[] = [];

    // Use a few educational keywords for search
    const searchTerms = ['educational', 'science', 'technology', 'programming tutorial', 'history documentary'];

    try {
        for (const term of searchTerms) {
            if (allResults.length >= 10) break;

            console.log(`Searching for "${term}" videos`);
            const searchResponse = await youtube.search.list({
                part: ['snippet'],
                q: term,
                type: ['video'],
                videoDefinition: 'high',
                maxResults: 10,
                order: 'viewCount', // Sort by view count to get popular ones
                relevanceLanguage: 'en'
            });

            if (!searchResponse.data.items || searchResponse.data.items.length === 0) continue;

            // Get the video IDs
            const videoIds = searchResponse.data.items
                .map(item => item.id?.videoId)
                .filter(id => id) as string[];

            if (videoIds.length === 0) continue;

            // Get detailed information for these videos
            const videoDetails = await youtube.videos.list({
                part: ['snippet', 'statistics', 'contentDetails'],
                id: videoIds
            });

            if (!videoDetails.data.items) continue;

            // Filter and format the videos
            const validVideos = videoDetails.data.items
                .filter(isTrendingVideoValid)
                .map(video => ({
                    videoId: video.id || '',
                    title: video.snippet?.title || '',
                    thumbnailUrl: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url || '',
                    channelName: video.snippet?.channelTitle || '',
                    viewCount: formatViewCount(parseInt(video.statistics?.viewCount || '0'))
                } as TrendingVideo));

            allResults.push(...validVideos);
        }

        console.log(`Found ${allResults.length} videos through keyword search`);
        return allResults;
    } catch (error) {
        console.error('Error searching for relevant videos:', error);
        return allResults; // Return whatever we've found so far
    }
}

// Fetch trending videos with optimized validation
async function fetchTrendingVideosFromAPI(): Promise<TrendingVideo[]> {
    try {
        // First, try to get general trending videos
        let validVideos = await fetchGeneralTrendingVideos();

        // If we didn't get enough, try searching by keywords
        if (validVideos.length < 10) {
            const searchResults = await searchRelevantVideos();

            // Add search results, avoiding duplicates
            const existingIds = new Set(validVideos.map(v => v.videoId));
            for (const video of searchResults) {
                if (!existingIds.has(video.videoId)) {
                    validVideos.push(video);
                    existingIds.add(video.videoId);

                    if (validVideos.length >= 10) break;
                }
            }
        }

        console.log(`Final valid videos count: ${validVideos.length}`);
        // Limit to 10 videos
        return validVideos.slice(0, 10);
    } catch (error) {
        console.error('Error fetching trending videos:', error);
        throw error; // Let the main handler deal with this
    }
}

// Cache trending videos with a 1-hour expiration
let cachedVideos: TrendingVideo[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET(request: NextRequest) {
    try {
        const currentTime = Date.now();

        // Check if we can use cached results
        if (cachedVideos && cachedVideos.length > 0 && (currentTime - cacheTimestamp < CACHE_DURATION)) {
            console.log('Returning cached trending videos');
            return NextResponse.json({ videos: cachedVideos });
        }

        // Get a fresh set of trending videos
        const trendingVideos = await fetchTrendingVideosFromAPI();

        // If we couldn't get any videos, return an error
        if (!trendingVideos || trendingVideos.length === 0) {
            return NextResponse.json(
                { error: 'TRENDING_FETCH_FAILED', message: 'No trending videos could be found' },
                { status: 500 }
            );
        }

        // Update cache
        cachedVideos = trendingVideos;
        cacheTimestamp = currentTime;

        return NextResponse.json({ videos: trendingVideos });
    } catch (error: any) {
        console.error('Error in trending videos route:', error);

        return NextResponse.json(
            { error: 'TRENDING_FETCH_FAILED', message: error.message || 'Failed to fetch trending videos' },
            { status: 500 }
        );
    }
}

// Maximum duration for this API route
export const maxDuration = 25; // Give enough time to perform searches if needed 