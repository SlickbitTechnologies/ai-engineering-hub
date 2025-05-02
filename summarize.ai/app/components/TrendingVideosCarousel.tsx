'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/Button';

interface TrendingVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  viewCount: string;
}

interface TrendingVideosCarouselProps {
  onSelectVideo: (videoUrl: string) => void;
}

export default function TrendingVideosCarousel({ onSelectVideo }: TrendingVideosCarouselProps) {
  const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const itemsPerPage = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  };

  // Detect screen size
  const [itemsToShow, setItemsToShow] = useState(itemsPerPage.desktop);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsToShow(itemsPerPage.mobile);
      } else if (window.innerWidth < 1024) {
        setItemsToShow(itemsPerPage.tablet);
      } else {
        setItemsToShow(itemsPerPage.desktop);
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTrendingVideos = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/youtube/trending');
        
        if (!response.ok) {
          throw new Error('Failed to fetch trending videos');
        }
        
        const data = await response.json();
        setTrendingVideos(data.videos);
      } catch (error) {
        console.error('Error fetching trending videos:', error);
        setError('Unable to load trending videos. Try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingVideos();
  }, []);

  useEffect(() => {
    // Setup autoplay
    if (!isPaused && trendingVideos.length > 0) {
      autoplayRef.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isPaused, currentIndex, trendingVideos, itemsToShow]);

  const maxIndex = Math.max(0, trendingVideos.length - itemsToShow);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleVideoClick = (videoId: string) => {
    const videoUrl = `https://youtube.com/watch?v=${videoId}`;
    onSelectVideo(videoUrl);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Truncate text to a certain length
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (error) {
    return (
      <div className="text-center py-6 text-red-500 dark:text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div 
      className="w-full relative py-8"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={carouselRef}
    >      
      <div className="relative overflow-hidden">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-1">
            {[...Array(itemsToShow)].map((_, i) => (
              <div key={i} className="h-[220px] rounded-lg bg-gray-200 dark:bg-[#3D5321]/40 animate-pulse relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Actual carousel */}
        {!isLoading && trendingVideos.length > 0 && (
          <>
            <div className="relative">
              <AnimatePresence initial={false}>
                <motion.div 
                  className="flex gap-4 px-1"
                  initial={{ x: 0 }}
                  animate={{ x: -currentIndex * (100 / itemsToShow) + '%' }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  {trendingVideos.map((video, index) => (
                    <motion.div 
                      key={video.videoId}
                      className={`flex-none w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-10.667px)]`}
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.18)",
                        zIndex: 5
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <button 
                        className="w-full relative overflow-hidden rounded-lg aspect-video focus:outline-none focus:ring-2 focus:ring-[#7CAA38] dark:focus:ring-[#9AC556]"
                        onClick={() => handleVideoClick(video.videoId)}
                        aria-label={`Trending video: ${video.title} by ${video.channelName}`}
                      >
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 right-3 text-left">
                          <h3 className="text-white font-semibold leading-tight mb-1 line-clamp-2">
                            {truncateText(video.title, 50)}
                          </h3>
                          <p className="text-gray-200 text-sm flex items-center justify-between">
                            <span>{video.channelName}</span>
                            <span>{video.viewCount}</span>
                          </p>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
              
              {/* Navigation arrows */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 bg-white/80 dark:bg-[#283618]/90 hover:bg-white dark:hover:bg-[#3D5321] text-black dark:text-white rounded-full w-10 h-10 shadow-md opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 sm:opacity-80"
                onClick={prevSlide}
                disabled={currentIndex === 0}
                aria-label="Previous videos"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 bg-white/80 dark:bg-[#283618]/90 hover:bg-white dark:hover:bg-[#3D5321] text-black dark:text-white rounded-full w-10 h-10 shadow-md opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 sm:opacity-80"
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                aria-label="Next videos"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Pagination dots */}
            <div className="flex justify-center mt-4 gap-1">
              {[...Array(maxIndex + 1)].map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex 
                      ? 'bg-[#7CAA38] dark:bg-[#9AC556] w-4' 
                      : 'bg-gray-300 dark:bg-[#5F8729]/50'
                  }`}
                  onClick={() => goToSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 