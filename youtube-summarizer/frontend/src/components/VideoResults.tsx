import React, { useState, useEffect } from 'react';
import { Video, searchVideos, generateSummaries, VideoSummary as VideoSummaryType } from '../services/api';
import VideoSummary from './VideoSummary';
import LoadingSpinner from './LoadingSpinner';
import './VideoResults.css';

const TRENDING_TOPICS = [
  'AI research',
  'Stock market trends',
  'Climate change',
  'Web development',
  'Machine learning'
];

const trendingTopics = [
  'Artificial Intelligence',
  'Blockchain Technology',
  'Quantum Computing',
  'Space Exploration',
  'Renewable Energy',
  'Cybersecurity',
  'Virtual Reality',
  '5G Technology',
  'Internet of Things',
  'Robotics',
  'AI research',
  'Stock market trends',
  'Climate change',
  'Web development',
  'Machine learning'
];

const WordCountDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minWords: number, maxWords: number) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [minWords, setMinWords] = useState(500);
  const [maxWords, setMaxWords] = useState(600);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (minWords < 100) {
      setError("Minimum word count must be at least 100 words");
      return;
    }
    
    if (maxWords < minWords) {
      setError("Maximum word count must be greater than minimum word count");
      return;
    }
    
    if (maxWords > 2000) {
      setError("Maximum word count cannot exceed 2000 words");
      return;
    }
    
    onConfirm(minWords, maxWords);
  };

  if (!isOpen) return null;

  return (
    <div className="word-count-dialog-overlay">
      <div className="word-count-dialog">
        <h3>Set Summary Length</h3>
        <p>Specify the desired word count range for the summary:</p>
        
        <form onSubmit={handleSubmit}>
          <div className="word-count-inputs">
            <div className="input-group">
              <label htmlFor="minWords">Minimum Words:</label>
              <input
                type="number"
                id="minWords"
                value={minWords}
                onChange={(e) => setMinWords(parseInt(e.target.value) || 0)}
                min={100}
                max={2000}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="maxWords">Maximum Words:</label>
              <input
                type="number"
                id="maxWords"
                value={maxWords}
                onChange={(e) => setMaxWords(parseInt(e.target.value) || 0)}
                min={100}
                max={2000}
              />
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="dialog-buttons">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="confirm-button">
              Generate Summary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VideoResults: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [summaries, setSummaries] = useState<VideoSummaryType[]>([]);
  const [currentSummary, setCurrentSummary] = useState<VideoSummaryType | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [durationFilter, setDurationFilter] = useState<string>('any');
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [transcriptStatus, setTranscriptStatus] = useState<Record<string, boolean>>({});
  const [wordCountDialogOpen, setWordCountDialogOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [wordCountRange, setWordCountRange] = useState<{min: number, max: number}>({ min: 500, max: 600 });

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setCurrentQuery(query);
    try {
      console.log(`Searching for "${query}" with duration filter: ${durationFilter}`);
      
      // Fetch videos with the maximum allowed by the backend (50)
      const response = await searchVideos(query, 50, durationFilter);
      console.log(`Search response: ${response.length} videos`);
      
      // Remove duplicates before storing all videos
      const seenVideoIds = new Set<string>();
      const uniqueVideos = response.filter(video => {
        if (seenVideoIds.has(video.video_id)) {
          return false; // Skip this video if we've seen it before
        }
        seenVideoIds.add(video.video_id);
        return true;
      });
      
      // Store all unique videos and show them immediately
      setAllVideos(uniqueVideos);
      applyFiltersAndSorting(uniqueVideos);
      
      console.log(`Videos set: ${uniqueVideos.length}`);
    } catch (err) {
      console.error('Error searching videos:', err);
      setError('Failed to search videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSummary = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the video card click
    
    // Find the existing summary for this video
    const existingSummary = summaries.find(s => s.video_id === videoId);
    
    if (existingSummary) {
      // If we already have a summary, show it immediately
      setCurrentSummary(existingSummary);
    } else {
      // If no summary exists, open the word count dialog
      setSelectedVideoId(videoId);
      setWordCountDialogOpen(true);
    }
  };

  const handleWordCountConfirm = async (minWords: number, maxWords: number) => {
    setWordCountDialogOpen(false);
    setWordCountRange({ min: minWords, max: maxWords });
    
    if (selectedVideoId) {
      await generateSummaryWithWordCount(selectedVideoId, minWords, maxWords);
      setSelectedVideoId(null);
    }
  };

  const generateSummaryWithWordCount = async (videoId: string, minWords: number, maxWords: number) => {
    setError(null);
    setSummarizing(true);
    setCurrentSummary(null);
    setTranscriptStatus(prev => ({ ...prev, [videoId]: true }));
    
    try {
      // Try to generate summary with retries
      let summaryGenerated = false;
      let retryCount = 0;
      const maxRetries = 2;
      let lastError = null;
      
      while (!summaryGenerated && retryCount <= maxRetries) {
        try {
          const response = await generateSummaries([videoId], minWords, maxWords);
          
          if (response.summaries && response.summaries.length > 0) {
            const newSummary = response.summaries[0];
            
            // Validate the summary
            if (!newSummary.summary || newSummary.summary.trim().length === 0) {
              throw new Error("Generated summary is empty");
            }
            
            setSummaries(prev => [...prev, newSummary]);
            setCurrentSummary(newSummary);
            setTranscriptStatus(prev => ({ ...prev, [videoId]: false }));
            console.log(`Summary generated for video: ${videoId}`);
            summaryGenerated = true;
          } else if (response.message) {
            // If there's an error message from the backend, use it
            throw new Error(response.message);
          } else {
            throw new Error("No summary was generated");
          }
        } catch (retryError: any) {
          console.error(`Error generating summary (attempt ${retryCount + 1}):`, retryError);
          lastError = retryError;
          retryCount++;
          
          if (retryCount > maxRetries) {
            // Show a user-friendly error message
            let errorMessage = "Failed to generate summary. ";
            if (lastError.message.includes("transcript")) {
              errorMessage += "This video may not have captions available.";
            } else if (lastError.message.includes("word count")) {
              errorMessage += "The generated summary was not the correct length.";
            } else {
              errorMessage += lastError.message;
            }
            setError(errorMessage);
            setTranscriptStatus(prev => ({ ...prev, [videoId]: false }));
          } else {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (err) {
      console.error('Error in summary generation process:', err);
      setError('Failed to generate summary. Please try again.');
      setTranscriptStatus(prev => ({ ...prev, [videoId]: false }));
    } finally {
      setSummarizing(false);
    }
  };

  const applyFiltersAndSorting = (videosToProcess: Video[]) => {
    // First apply duration filter
    let filteredVideos = [...videosToProcess];
    
    // Remove duplicates by tracking video IDs
    const seenVideoIds = new Set<string>();
    filteredVideos = filteredVideos.filter(video => {
      if (seenVideoIds.has(video.video_id)) {
        return false; // Skip this video if we've seen it before
      }
      seenVideoIds.add(video.video_id);
      return true;
    });
    
    // Filter out videos less than 1 minute
    filteredVideos = filteredVideos.filter(video => {
      if (!video.duration_seconds) return false;
      return video.duration_seconds >= 60; // Only include videos 1 minute or longer
    });
    
    // Apply duration filter if set
    if (durationFilter !== 'any') {
      console.log(`Applying duration filter: ${durationFilter}`);
      filteredVideos = filteredVideos.filter(video => {
        if (!video.duration_seconds) return false;
        
        if (durationFilter === 'short' && video.duration_seconds >= 60 && video.duration_seconds < 300) {
          return true; // 1-5 minutes
        } else if (durationFilter === 'medium' && video.duration_seconds >= 300 && video.duration_seconds < 1800) {
          return true; // 5-30 minutes
        } else if (durationFilter === 'long' && video.duration_seconds >= 1800) {
          return true; // >30 minutes
        }
        return false;
      });
      console.log(`After duration filter: ${filteredVideos.length} videos`);
    }
    
    // If we have less than 10 videos after filtering, try to fetch more
    if (filteredVideos.length < 10 && currentQuery) {
      // If we've already fetched 50 videos and still don't have enough, 
      // try to fetch more with a different approach
      if (allVideos.length >= 50) {
        // Try to fetch more videos with a broader search
        const broaderQuery = currentQuery.split(' ').slice(0, -1).join(' ');
        if (broaderQuery && broaderQuery !== currentQuery) {
          console.log('Trying broader search with:', broaderQuery);
          handleSearch(broaderQuery);
          return;
        }
      } else {
        // Fetch more videos with the same query
        console.log('Fetching more videos with same query');
        handleSearch(currentQuery);
        return;
      }
    }
    
    // Update the videos state with the filtered results
    setVideos(filteredVideos);
    
    // If we still don't have enough videos, show a message
    if (filteredVideos.length < 10 && filteredVideos.length > 0) {
      setError(`Found only ${filteredVideos.length} videos matching your criteria. Try adjusting your filters.`);
    } else if (filteredVideos.length === 0) {
      setError('No videos found matching your criteria. Try a different search term or adjust your filters.');
    }
  };

  const handleDurationFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDuration = e.target.value;
    setDurationFilter(newDuration);
    
    // Clear the cache for this query to ensure we get fresh results
    if (currentQuery) {
      // Clear all cache entries for this query
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`search-${currentQuery}-`)) {
          localStorage.removeItem(key);
        }
      }
    }
    
    // If we have a current query, fetch new results with the updated duration filter
    if (currentQuery) {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Use a timeout to prevent UI from freezing
      setTimeout(() => {
        // Use handleSearch to ensure consistent behavior
        handleSearch(currentQuery);
      }, 100);
    } else {
      // If no current query, just apply the filter to existing videos
      applyFiltersAndSorting(allVideos);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  const handleTopicClick = (topic: string) => {
    setSearchQuery(topic);
    handleSearch(topic);
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideo(prev => prev === videoId ? null : videoId);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // For very recent uploads (less than 1 hour)
    if (diffMinutes < 1) {
      return 'Just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    // For uploads less than 24 hours
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    // For uploads less than 7 days
    if (diffDays <= 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    // For uploads less than 30 days
    if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    }
    // For uploads less than 365 days
    if (diffDays <= 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    // For older uploads
    const years = Math.floor(diffDays / 365);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const isRecentUpload = (dateString: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    return diffHours < 24;
  };

  return (
    <div className="video-results">
      <div className="hero-section">
        <h2>Credible Summaries from Verified YouTube Channels <br />with Over 100K Subscribers.</h2>
        <p className="subtitle">
          Get summaries, key points, and actionable insights from any YouTube video in seconds.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for topics, videos, or channels..."
              className="search-input"
              disabled={loading}
            />
            {loading && (
              <div className="search-loading">
                <LoadingSpinner size="small" />
              </div>
            )}
          </div>
        </form>
        <div className="trending-topics">
          <span className="trending-label">Trending:</span>
          {trendingTopics.map(topic => (
            <button
              key={topic}
              className={`topic-button ${searchQuery === topic ? 'active' : ''}`}
              onClick={() => handleTopicClick(topic)}
              disabled={loading}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {(videos.length > 0 || loading) && (
        <div className="results-section">
          <div className="results-header">
            <h2>
              {currentQuery ? (
                <>Results for "{currentQuery}" <span className="results-count">({videos.length} videos)</span></>
              ) : (
                'Top Results'
              )}
            </h2>
            <div className="results-filters">
              <div className="filter-section">
                <select 
                  className="filter-select" 
                  value={durationFilter} 
                  onChange={handleDurationFilterChange}
                  disabled={loading}
                >
                  <option value="any">Any Duration (1min+)</option>
                  <option value="short">Short (1-5 min)</option>
                  <option value="medium">Medium (5-30 min)</option>
                  <option value="long">Long (&gt; 30 min)</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="video-grid">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="video-card skeleton">
                  <div className="thumbnail-container skeleton-thumbnail"></div>
                  <div className="video-info">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-channel"></div>
                    <div className="skeleton-stats">
                      <div className="skeleton-stat"></div>
                      <div className="skeleton-stat"></div>
                      <div className="skeleton-stat"></div>
                    </div>
                    <div className="skeleton-time"></div>
                    <div className="skeleton-button"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {videos.length > 0 ? (
                <div className="video-grid">
                  {videos.map((video) => (
                    <div
                      key={video.video_id}
                      className={`video-card ${selectedVideo === video.video_id ? 'selected' : ''}`}
                      onClick={() => handleVideoSelect(video.video_id)}
                    >
                      <div className="thumbnail-container">
                        <img src={video.thumbnail} alt={video.title} />
                        {video.duration_seconds && (
                          <span className="duration">{formatDuration(video.duration_seconds)}</span>
                        )}
                        {selectedVideo === video.video_id && (
                          <div className="selected-overlay">
                            <span className="checkmark">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="video-info">
                        <h3>{video.title}</h3>
                        <p className="channel">{video.channel}</p>
                        <div className="video-stats">
                          <span>{formatNumber(video.views)} views</span>
                          <span>{formatNumber(video.likes)} likes</span>
                          <span>{formatNumber(video.comments)} comments</span>
                          <span>{formatNumber(video.subscriber_count)} subscribers</span>
                        </div>
                        <div className={`video-time ${isRecentUpload(video.published_at) ? 'recent' : ''}`}>
                          {formatTimeAgo(video.published_at)}
                        </div>
                        <button 
                          className={`view-summary-button ${transcriptStatus[video.video_id] ? 'loading' : ''} ${error && error.includes(video.video_id) ? 'error' : ''}`}
                          onClick={(e) => handleViewSummary(video.video_id, e)}
                          disabled={summarizing && currentSummary?.video_id === video.video_id}
                          title={error && error.includes(video.video_id) ? error : ''}
                        >
                          {summarizing && currentSummary?.video_id === video.video_id 
                            ? 'Generating Summary...' 
                            : summaries.some(s => s.video_id === video.video_id)
                              ? 'View Summary'
                              : transcriptStatus[video.video_id]
                                ? 'Generating...'
                                : error && error.includes(video.video_id)
                                  ? 'No Transcript Available'
                                  : 'Generate Summary'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  No videos with available transcripts found for "{currentQuery}". Try a different search term.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!loading && videos.length === 0 && currentQuery && (
        <div className="no-results">
          No videos with available transcripts found for "{currentQuery}". Try a different search term.
        </div>
      )}

      {summarizing && (
        <div className="summary-loading-overlay">
          <div className="summary-loading-container">
            <LoadingSpinner size="large" text="Generating summary..." />
            <p className="summary-loading-subtext">This may take a few moments</p>
          </div>
        </div>
      )}

      {currentSummary && (
        <VideoSummary
          summary={currentSummary}
          onClose={() => setCurrentSummary(null)}
        />
      )}

      <WordCountDialog
        isOpen={wordCountDialogOpen}
        onClose={() => setWordCountDialogOpen(false)}
        onConfirm={handleWordCountConfirm}
      />
    </div>
  );
};

export default VideoResults;