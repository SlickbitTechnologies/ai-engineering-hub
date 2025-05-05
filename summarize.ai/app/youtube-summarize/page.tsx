'use client';

// Dynamic directive for Vercel deployment
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlayCircle, AlertCircle, Copy, RefreshCw, Send, X, Youtube, Clock, Info, Download, Share2, Bookmark, MessageSquare, ChevronDown, ArrowRight, HelpCircle, Sparkles, Brain, FileText, Shield, Users, Clock3, Trash2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/app/components/MainLayout';
import { Button } from '@/app/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Textarea } from '@/app/components/ui/Textarea';
import { useAuth } from '@/app/context/AuthContext';
import { RootState } from '@/app/redux/store';
import { fetchTranscript, clearYoutubeState } from '@/app/redux/features/youtubeSlice';
import { addToHistory } from '@/app/firebase/history';
import TrendingVideosCarousel from '@/app/components/TrendingVideosCarousel';
import { AuthGuard } from '../components/AuthGuard';

// Add Typewriter component for streaming effect
function TypewriterEffect({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30); // 30ms per character
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text]);
  
  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);
  
  // Highlight timestamps in the format [00:00]
  const formattedText = displayedText.replace(/\[(\d+:\d+|\d+:\d+-\d+:\d+)\]/g, match => 
    `<span class="text-[#5F8729] font-medium">${match}</span>`
  );
  
  return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
}

export default function YouTubeSummarizerPage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [showTrending, setShowTrending] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);
  
  const { 
    transcript, 
    summary, 
    highlights, 
    keypoints, 
    isLoading, 
    progress,
    processingStage,
    videoDetails,
    error,
    validationError
  } = useSelector((state: RootState) => state.youtube);

  const [summaryRef, summaryInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [highlightsRef, highlightsInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [keypointsRef, keypointsInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [chatRef, chatInView] = useInView({ threshold: 0.2, triggerOnce: true });

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const validateYoutubeUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getEmbedUrl = (url: string) => {
    const videoId = validateYoutubeUrl(url);
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');
    
    const videoId = validateYoutubeUrl(url);
    if (!videoId) {
      setUrlError('Please enter a valid YouTube URL');
      return;
    }
    
    dispatch(fetchTranscript(url) as any);
    setShowTrending(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || !transcript || !summary) return;
    
    const userMessage = { role: 'user', content: chatQuestion };
    setChatHistory([...chatHistory, userMessage]);
    setChatQuestion('');
    setIsChatLoading(true);
    
    try {
      const response = await fetch('/api/youtube/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, summary, question: chatQuestion }),
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I was unable to process your question. Please try again.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSelectTrendingVideo = (videoUrl: string) => {
    setUrl(videoUrl);
    
    const videoId = validateYoutubeUrl(videoUrl);
    if (videoId) {
      dispatch(fetchTranscript(videoUrl) as any);
      setShowTrending(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  const clearAll = () => {
    setUrl('');
    setUrlError('');
    setChatHistory([]);
    dispatch(clearYoutubeState());
    setShowTrending(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAddToHistory = async () => {
    if (user && transcript && summary) {
      await addToHistory({
        userId: user.uid,
        type: 'youtube',
        url,
        content: summary,
        timestamp: new Date().toISOString(),
        title: 'YouTube Summary'
      });
    }
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
        <div className="min-h-screen content-layer">
          <div className="relative bg-gradient-to-r from-[#283618]/80 via-[#3D5321]/60 to-[#5F8729]/80 dark:from-[#283618] dark:via-[#3D5321] dark:to-[#5F8729] rounded-b-3xl mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
            <div className="container mx-auto p-8 pt-10 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Youtube className="text-white w-5 h-5" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">YouTube Summarizer</h1>
                </div>
                <p className="text-white/80 max-w-2xl">
                  Extract key insights, summaries, and highlights from any YouTube video with our advanced AI. Save time and boost your learning efficiency.
                </p>
                
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-xl p-2 border border-white/20 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                    <Youtube className="w-5 h-5" />
                  </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste YouTube URL here..."
                    className="w-full p-4 pl-10 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-[#9AC556] hover:bg-[#B6D87E] text-[#283618] font-medium shrink-0 shadow-md"
                  disabled={isLoading}
                  leftIcon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                >
                      Summarize
                </Button>
              </div>
              {urlError && (
                <div className="text-red-300 mt-2 flex items-center gap-1 text-sm p-2 pl-10">
                  <AlertCircle className="w-4 h-4" /> {urlError}
                </div>
              )}
            </motion.form>
          </motion.div>
          </div>
        
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path d="M0 50L48 45.7C96 41.3 192 32.7 288 29.2C384 25.7 480 27.3 576 35.3C672 43.3 768 57.7 864 62.5C960 67.3 1056 62.7 1152 56.8C1248 51 1344 44 1392 40.5L1440 37V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" 
                  fill="var(--background)" />
            </svg>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl">
          <AnimatePresence>
            {showTrending && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8 overflow-hidden"
              >
                <div className="bg-[#F9FBF3] dark:bg-[#283618]/70 rounded-2xl p-6 border border-[#DDE8C6] dark:border-[#5F8729]/40 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 text-[#283618] dark:text-[#D4E8AE] flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-[#7CAA38]" />
                    Trending Videos
                  </h2>
                  <TrendingVideosCarousel onSelectVideo={handleSelectTrendingVideo} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-8 mb-8 bg-white dark:bg-[#283618]/80 rounded-xl border border-[#DDE8C6] dark:border-[#5F8729]/40 shadow-sm"
            >
              <div className="w-full max-w-md mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#5F8729] dark:text-[#9AC556] font-medium text-sm">{processingStage}</span>
                  <span className="text-gray-500 dark:text-[#B6D87E]/70 text-sm">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#3D5321]/40 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-r from-[#7CAA38] to-[#9AC556] h-full rounded-full"
                  />
                </div>
              </div>
              
              {validationError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-200 p-6 rounded-xl w-full max-w-md flex flex-col items-center gap-4">
                  <div className="bg-red-100 dark:bg-red-800/20 p-3 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium mb-1">URL Validation Failed</h3>
                    <p className="text-sm">{validationError}</p>
                    <p className="text-xs mt-4 opacity-80">
                      We only process videos that are under 90 minutes, from verified channels with at least 200,000 subscribers.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-2 border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400"
                    onClick={clearAll}
                  >
                    Try a Different Video
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#7CAA38] dark:text-[#9AC556]" />
                    <p className="text-gray-600 dark:text-[#B6D87E]/90 text-sm">Processing video content...</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mt-8">
                    <div className="lg:col-span-1">
                      <div className="bg-gray-200 dark:bg-[#3D5321]/40 rounded-xl aspect-video w-full animate-pulse mb-4"></div>
                      <div className="bg-gray-200 dark:bg-[#3D5321]/40 rounded-xl w-full h-[300px] animate-pulse"></div>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="w-full bg-gray-200 dark:bg-[#3D5321]/40 rounded-xl p-6 mb-6 animate-pulse">
                        <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-1/4 mb-3"></div>
                        <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-3/4"></div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-[#3D5321]/40 rounded-xl p-6 mb-6 animate-pulse">
                        <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-1/4 mb-3"></div>
                        <div className="flex gap-2 mb-2">
                          <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-[#3D5321]/60 mt-1"></div>
                          <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-full"></div>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-[#3D5321]/60 mt-1"></div>
                          <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-full"></div>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-[#3D5321]/60 mt-1"></div>
                          <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-full"></div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-[#3D5321]/40 rounded-xl p-6 animate-pulse">
                        <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-1/4 mb-3"></div>
                        <div className="flex gap-2 mb-2">
                          <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-[#3D5321]/60 mt-1"></div>
                          <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-full"></div>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-[#3D5321]/60 mt-1"></div>
                          <div className="h-4 bg-gray-300 dark:bg-[#3D5321]/60 rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-200 p-6 rounded-xl mb-8 flex items-center gap-4"
            >
              <div className="bg-red-100 dark:bg-red-800/20 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Unable to Process Video</h3>
              <p>
                {error === 'TRANSCRIPT_NOT_AVAILABLE' 
                    ? 'This video may not have captions available. Try a different video or check the privacy settings.'
                    : error}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="ml-auto border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400"
                onClick={clearAll}
              >
                Try Again
              </Button>
            </motion.div>
          )}

          {validationError && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-200 p-6 rounded-xl mb-8 flex flex-col md:flex-row items-center gap-4"
            >
              <div className="bg-red-100 dark:bg-red-800/20 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="font-medium mb-1">Video Validation Failed</h3>
                <p className="mb-2">{validationError}</p>
                <p className="text-xs opacity-80">
                  We only process videos that are under 90 minutes, from verified channels with at least 200,000 subscribers.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="md:ml-auto border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400"
                onClick={clearAll}
              >
                Try a Different Video
              </Button>
            </motion.div>
          )}

          {transcript && transcript.length > 0 && !error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {videoDetails && (
              <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#F9FBF3] dark:bg-[#283618]/60 rounded-xl p-4 mb-6 border border-[#DDE8C6] dark:border-[#5F8729]/40 shadow-sm"
                >
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Shield className="text-[#5F8729] dark:text-[#9AC556] w-5 h-5" />
                      <div>
                        <h3 className="text-gray-700 dark:text-[#D4E8AE] font-medium text-sm">{videoDetails.channel}</h3>
                        <p className="text-gray-500 dark:text-[#B6D87E]/70 text-xs mt-0.5">{videoDetails.title}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="text-[#5F8729] dark:text-[#9AC556] w-4 h-4" />
                        <span className="text-gray-600 dark:text-[#B6D87E] text-xs">{videoDetails.subscribers}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock3 className="text-[#5F8729] dark:text-[#9AC556] w-4 h-4" />
                        <span className="text-gray-600 dark:text-[#B6D87E] text-xs">{videoDetails.duration}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="lg:col-span-1">
                  <div className="mb-6">
                    <Card className="dark:border-[#5F8729]/50 dark:bg-[#283618]/90 overflow-hidden shadow-lg rounded-2xl">
                  <div className="aspect-video w-full">
                    <iframe 
                      ref={videoRef}
                      src={getEmbedUrl(url)}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                      <div className="bg-[#F3F8E9] dark:bg-[#3D5321]/70 p-2 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(url)}
                            className="text-[#5F8729] dark:text-[#9AC556] h-8 w-8 p-0"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddToHistory}
                            className="text-[#5F8729] dark:text-[#9AC556] h-8 w-8 p-0"
                          >
                            <Bookmark className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={clearAll}
                          className="border-[#7CAA38]/30 text-[#5F8729] dark:text-[#9AC556] h-8 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          New
                        </Button>
                  </div>
                </Card>
                  </div>

                  <Card className="dark:border-[#5F8729]/50 dark:bg-[#283618]/90 overflow-hidden shadow-lg rounded-2xl">
                    <div className="bg-gradient-to-r from-[#F3F8E9] to-[#F9FBF3] dark:from-[#3D5321]/70 dark:to-[#3D5321]/40 p-4 border-b border-[#DDE8C6] dark:border-[#5F8729]/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-1.5 rounded-full bg-[#DDE8C6]/80 dark:bg-[#5F8729]/30 mr-3">
                            <FileText className="w-5 h-5 text-[#5F8729] dark:text-[#9AC556]" />
                          </div>
                          <span className="font-medium text-gray-800 dark:text-[#D4E8AE]">Transcript</span>
                        </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                        onClick={() => copyToClipboard(transcript?.map(t => t.text).join(' ') || '')}
                        className="h-8 dark:text-[#9AC556] dark:hover:text-[#D4E8AE] dark:hover:bg-[#3D5321]/50 rounded-lg"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                    <div className="p-4 bg-gradient-to-b from-[#FCFDF7] to-[#F3F8E9] dark:from-[#283618]/90 dark:to-[#283618]/70 h-[300px] overflow-y-auto modern-scrollbar">
                      <div className="h-[400px] overflow-y-auto pr-2 space-y-2 modern-scrollbar">
                      {transcript.map((item, index) => (
                        <div 
                          key={index} 
                            className={`flex py-1.5 border-l-2 pl-2 transition-colors rounded-r ${
                            currentTimestamp >= item.startTime && 
                            (index === transcript.length - 1 || currentTimestamp < transcript[index + 1].startTime)
                                ? 'border-[#7CAA38] dark:border-[#9AC556] bg-[#7CAA38]/5 dark:bg-[#9AC556]/10'
                                : 'border-transparent hover:border-[#7CAA38]/30 hover:bg-[#F3F8E9]/80 dark:hover:border-[#9AC556]/30 dark:hover:bg-[#9AC556]/5'
                          }`}
                        >
                            <span className="text-xs font-mono w-10 shrink-0 pt-0.5 text-[#7CAA38] dark:text-[#9AC556] font-medium">
                            {formatTime(item.startTime)}
                          </span>
                            <span className="text-sm text-gray-700 dark:text-[#D4E8AE]">{item.text}</span>
                        </div>
                      ))}
                      </div>
                    </div>
                </Card>
                </div>
                
                <div className="lg:col-span-2">
                  <Card className="dark:border-[#5F8729]/50 dark:bg-[#283618]/90 shadow-sm overflow-hidden rounded-xl h-auto">
                    <div className="border-b border-[#DDE8C6]/80 dark:border-[#5F8729]/30 bg-white dark:bg-[#283618]">
                      <div className="flex">
                        <button
                          onClick={() => setActiveTab('summary')}
                          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === 'summary' 
                              ? 'text-[#5F8729] border-b-2 border-[#5F8729] dark:text-[#9AC556] dark:border-[#9AC556]' 
                              : 'text-gray-500 dark:text-[#B6D87E]/70 hover:text-[#5F8729] dark:hover:text-[#9AC556]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#5F8729] dark:text-[#9AC556]" />
                            <span>Summary</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setActiveTab('chat')}
                          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === 'chat' 
                              ? 'text-[#5F8729] border-b-2 border-[#5F8729] dark:text-[#9AC556] dark:border-[#9AC556]' 
                              : 'text-gray-500 dark:text-[#B6D87E]/70 hover:text-[#5F8729] dark:hover:text-[#9AC556]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>AI Chat</span>
                          </div>
                        </button>
                    </div>
                  </div>

                    <div className="p-4 bg-gradient-to-b from-transparent to-[#F9FBF3]/50 dark:to-[#283618] h-[570px] overflow-y-auto">
                      <AnimatePresence mode="wait">
                    {activeTab === 'summary' && (
                      <motion.div
                            key="summary"
                        initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="p-6 space-y-8"
                          >
                            <div className="bg-white dark:bg-[#283618] rounded-lg border border-[#DDE8C6]/60 dark:border-[#5F8729]/20 p-4 shadow-sm">
                              <div className="flex items-center mb-2">
                                <h3 className="text-[#5F8729] dark:text-[#9AC556] text-sm font-semibold">
                                  Summary
                                </h3>
                              </div>
                              <div className="prose prose-sm max-w-none">
                                <p className="leading-relaxed text-gray-700 dark:text-[#D4E8AE] text-sm">{summary}</p>
                        </div>
                          </div>

                            <div className="bg-white dark:bg-[#283618] rounded-lg border border-[#DDE8C6]/60 dark:border-[#5F8729]/20 p-4 shadow-sm">
                              <div>
                                <div className="flex items-center mb-2">
                                  <h3 className="text-[#5F8729] dark:text-[#9AC556] text-sm font-semibold flex items-center">
                                    <Info className="w-4 h-4 mr-1.5 text-[#5F8729] dark:text-[#9AC556]" />
                                    Highlights
                                  </h3>
                        </div>
                        {isLoading ? (
                                  <div className="space-y-4">
                                    {[...Array(4)].map((_, i) => (
                                      <div key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 mt-1 rounded-full bg-[#F3F8E9] dark:bg-[#3D5321]/40 animate-pulse"></div>
                                        <div className="w-full h-4 bg-[#F3F8E9] dark:bg-[#3D5321]/40 rounded animate-pulse"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                                  <ul className="space-y-4">
                            {highlights?.map((highlight, index) => (
                                      <motion.li 
                                        key={index} 
                                        className="flex items-start mb-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                      >
                                        <div className="w-1.5 h-1.5 mt-1.5 mr-2 rounded-full bg-[#5F8729] dark:bg-[#9AC556] flex-shrink-0"></div>
                                        <span className="text-sm text-gray-700 dark:text-[#D4E8AE]">{highlight}</span>
                                      </motion.li>
                            ))}
                          </ul>
                        )}
                              </div>
                            </div>

                            <div className="bg-white dark:bg-[#283618] rounded-lg border border-[#DDE8C6]/60 dark:border-[#5F8729]/20 p-4 shadow-sm">
                              <div>
                                <div className="flex items-center mb-2">
                                  <h3 className="text-[#5F8729] dark:text-[#9AC556] text-sm font-semibold flex items-center">
                                    <Brain className="w-4 h-4 mr-1.5 text-[#5F8729] dark:text-[#9AC556]" />
                                    Key Insights
                                  </h3>
                        </div>
                        {isLoading ? (
                                  <div className="space-y-4">
                                    {[...Array(4)].map((_, i) => (
                                      <div key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 mt-1 rounded-full bg-[#F3F8E9] dark:bg-[#3D5321]/40 animate-pulse"></div>
                                        <div className="w-full h-4 bg-[#F3F8E9] dark:bg-[#3D5321]/40 rounded animate-pulse"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                                  <ul className="space-y-4">
                            {keypoints?.map((point, index) => (
                                      <motion.li 
                                        key={index} 
                                        className="flex items-start mb-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                      >
                                        <div className="w-1.5 h-1.5 mt-1.5 mr-2 rounded-full bg-[#5F8729] dark:bg-[#9AC556] flex-shrink-0"></div>
                                        <span className="text-sm text-gray-700 dark:text-[#D4E8AE]">{point}</span>
                                      </motion.li>
                            ))}
                          </ul>
                        )}
                              </div>
                            </div>
                      </motion.div>
                    )}

                        {activeTab === 'chat' && (
                <motion.div
                            key="chat"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full flex flex-col relative"
                  ref={chatRef}
                >
                            {/* Clear chat button - top right */}
                        {/* {chatHistory.length > 0 && (
                              <div className="absolute top-2 right-3 z-10">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearChat}
                                  className="text-xs h-8 text-[#5F8729] dark:text-[#9AC556] hover:bg-[#F3F8E9]/50 flex items-center gap-1.5 rounded-full pl-2 pr-2.5"
                          >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Clear Chat</span>
                          </Button>
                              </div>
                            )} */}
                            
                            <div className="flex-grow overflow-y-auto p-4 modern-scrollbar">
                              {chatHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                  <div className="w-16 h-16 rounded-full bg-[#F3F8E9] dark:bg-[#3D5321]/40 flex items-center justify-center">
                                    <MessageSquare className="w-8 h-8 text-[#7CAA38] dark:text-[#9AC556]" />
                      </div>
                                  <p className="text-gray-500 dark:text-[#B6D87E]/70 text-center text-sm max-w-xs italic">
                                    Ask questions about this video to get AI insights
                              </p>
                            </div>
                          ) : (
                                <div className="space-y-4 pb-4">
                              {chatHistory.map((message, index) => (
                                    <motion.div 
                                  key={index} 
                                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                >
                                  <div 
                                        className={`max-w-[85%] rounded-2xl p-4 ${
                                      message.role === 'user' 
                                            ? 'bg-[#B6D87E] text-[#283618] font-medium' 
                                            : ' dark:bg-[#2F3B20] text-gray-800 dark:text-[#D4E8AE]'
                                        }`}
                                      >
                                        {message.role === 'user' ? (
                                          message.content
                                        ) : (
                                          index === chatHistory.length - 1 && isChatLoading ? (
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-[#9AC556] animate-pulse"></div>
                                              <div className="w-2 h-2 rounded-full bg-[#9AC556] animate-pulse delay-100"></div>
                                              <div className="w-2 h-2 rounded-full bg-[#9AC556] animate-pulse delay-200"></div>
                                  </div>
                                          ) : (
                                            <TypewriterEffect text={message.content} />
                                          )
                                        )}
                                </div>
                                    </motion.div>
                                  ))}
                              <div ref={chatEndRef} />
                            </div>
                          )}
                        </div>

                            <div className="p-3 border-t border-[#DDE8C6]/60 dark:border-[#5F8729]/20 bg-white dark:bg-[#283618]">
                              <div className="relative rounded-full border border-[#DDE8C6] focus-within:border-[#7CAA38] dark:border-[#5F8729]/30 dark:bg-[#283618]/80 shadow-sm overflow-hidden flex items-center">
                                <textarea
                            value={chatQuestion}
                            onChange={(e) => setChatQuestion(e.target.value)}
                                  placeholder="Ask any question about this video..."
                                  className="resize-none border-none focus:ring-0 bg-transparent dark:text-[#D4E8AE] text-sm py-3 pl-4 pr-14 w-full max-h-32 min-h-[50px] outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      if (chatQuestion.trim()) {
                                        handleChatSubmit(e);
                                      }
                                    }
                                  }}
                                />
                                <button
                                  onClick={handleChatSubmit}
                                  disabled={!chatQuestion.trim() || isChatLoading}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-[#9AC556] text-white hover:bg-[#7CAA38] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                  aria-label="Send message"
                                >
                                  {isChatLoading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                            <Send className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      </div>
                  </Card>
                </div>
              </div>
              </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  </AuthGuard>
  );
} 