import { google } from 'googleapis';
import axios from 'axios';

// Initialize the YouTube API client
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

/**
 * Extract YouTube video ID from URL
 */
export function extractVideoId(url: string): string | null {
    try {
        // Handle both youtube.com and youtu.be URLs
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting video ID:', error);
        return null;
    }
}

/**
 * Parse ISO 8601 duration format to seconds
 */
function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get video details including duration
 */
async function getVideoDetails(videoId: string) {
    try {
        const response = await youtube.videos.list({
            part: ['contentDetails', 'snippet'],
            id: [videoId]
        });

        if (!response.data.items || response.data.items.length === 0) {
            throw new Error('Video not found');
        }

        const video = response.data.items[0];
        const duration = video.contentDetails?.duration || '';
        const channelId = video.snippet?.channelId || '';
        const title = video.snippet?.title || '';

        return {
            durationISO: duration,
            durationSeconds: parseISO8601Duration(duration),
            channelId,
            title
        };
    } catch (error) {
        console.error('Error fetching video details:', error);
        throw new Error('Failed to fetch video details');
    }
}

/**
 * Get channel statistics including subscriber count
 */
async function getChannelStats(channelId: string) {
    try {
        const response = await youtube.channels.list({
            part: ['statistics', 'snippet'],
            id: [channelId]
        });

        if (!response.data.items || response.data.items.length === 0) {
            throw new Error('Channel not found');
        }

        const channel = response.data.items[0];
        const subscriberCount = parseInt(channel.statistics?.subscriberCount || '0');
        const channelTitle = channel.snippet?.title || '';

        return {
            subscriberCount,
            channelTitle
        };
    } catch (error) {
        console.error('Error fetching channel stats:', error);
        throw new Error('Failed to fetch channel statistics');
    }
}

/**
 * Extract ytInitialData JSON blob from a YouTube channel page.
 */
function extractInitialData(html: string) {
    const match = html.match(/ytInitialData\s*=\s*(\{.+?\});/);
    if (!match) return null;
    try {
        return JSON.parse(match[1]);
    } catch (e) {
        console.error('Error parsing ytInitialData:', e);
        return null;
    }
}

/**
 * Check if a channel is verified
 * Uses multiple strategies to detect verified badges
 */
async function isChannelVerified(channelId: string): Promise<boolean> {
    try {
        const url = `https://www.youtube.com/channel/${channelId}`;
        const response = await axios.get(url);
        const html = response.data;

        // Strategy 1: Check JSON-based badge detection
        const data = extractInitialData(html);
        if (data) {
            const header = data.header?.c4TabbedHeaderRenderer || {};
            // ownerBadges in new layout, badges in some older layouts
            const badges = header.ownerBadges || header.badges || [];

            const verifiedInJson = badges.some((b: any) => {
                const md = b.metadataBadgeRenderer;
                return md && (
                    // Check for various verification indicators
                    (md.style && md.style.includes('VERIFIED')) ||
                    (md.style && md.style === 'BADGE_STYLE_TYPE_VERIFIED') ||
                    (md.label === 'Verified') ||
                    (md.tooltip === 'Verified') ||
                    (md.tooltipText && md.tooltipText.includes('Verified'))
                );
            });

            if (verifiedInJson) {
                return true;
            }
        }

        // Strategy 2: Fallback to regex search in raw HTML
        const verifiedInHtml = /aria-label=["']Verified["']/i.test(html) ||
            /BADGE_STYLE_TYPE_VERIFIED/.test(html);

        return verifiedInHtml;
    } catch (error) {
        console.error('Error checking channel verification:', error);
        return false; // Default to false if there's an error
    }
}

/**
 * Validate a YouTube URL against our constraints
 */
export async function validateYouTubeURL(url: string) {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) {
            return {
                valid: false,
                error: 'Invalid YouTube URL'
            };
        }

        // Get video details
        const videoDetails = await getVideoDetails(videoId);

        // Check video duration (90 minutes = 5400 seconds)
        if (videoDetails.durationSeconds > 5400) {
            return {
                valid: false,
                error: 'Video is longer than 90 minutes',
                details: {
                    title: videoDetails.title,
                    duration: Math.floor(videoDetails.durationSeconds / 60) + ' minutes'
                }
            };
        }

        // Get channel statistics
        const channelStats = await getChannelStats(videoDetails.channelId);

        // Check subscriber count
        if (channelStats.subscriberCount < 200000) {
            return {
                valid: false,
                error: 'Channel has fewer than 200,000 subscribers',
                details: {
                    channel: channelStats.channelTitle,
                    subscribers: channelStats.subscriberCount.toLocaleString()
                }
            };
        }

        // Check verification status
        const verified = await isChannelVerified(videoDetails.channelId);
        if (!verified) {
            return {
                valid: false,
                error: 'Channel is not verified',
                details: {
                    channel: channelStats.channelTitle
                }
            };
        }

        // All checks passed
        return {
            valid: true,
            details: {
                title: videoDetails.title,
                channel: channelStats.channelTitle,
                duration: Math.floor(videoDetails.durationSeconds / 60) + ' minutes',
                subscribers: channelStats.subscriberCount.toLocaleString()
            }
        };
    } catch (error: any) {
        console.error('Error validating YouTube URL:', error);
        return {
            valid: false,
            error: error.message || 'Failed to validate YouTube URL'
        };
    }
} 