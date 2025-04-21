'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  HistoryIcon, 
  ClockIcon, 
  TrashIcon, 
  GlobeIcon, 
  FileTextIcon, 
  HeadphonesIcon, 
  TypeIcon, 
  LanguagesIcon,
  SearchIcon,
  FilterIcon,
  AlertCircle,
  UserIcon,
  XIcon
} from 'lucide-react';
import { getCurrentUser } from '../firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/Button';
import Link from 'next/link';
import { getSummaries, deleteSummary, SummaryItem } from '../firebase/history';

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedSummary, setSelectedSummary] = useState<SummaryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      fetchSummaries();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchSummaries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedSummaries = await getSummaries();
      setSummaries(fetchedSummaries);
    } catch (err) {
      console.error('Error fetching summaries:', err);
      setError('Failed to load your summaries. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSummary = async (id: string) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this summary?')) {
      setIsDeleting(true);
      try {
        const success = await deleteSummary(id);
        if (success) {
          setSummaries(prevSummaries => prevSummaries.filter(summary => summary.id !== id));
        } else {
          setError('Failed to delete the summary. Please try again.');
        }
      } catch (err) {
        console.error('Error deleting summary:', err);
        setError('Failed to delete the summary. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredSummaries = summaries
    .filter(summary => filter === 'all' || summary.sourceType === filter)
    .filter(summary => 
      summary.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      summary.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const sourceTypeIcon = (type: string) => {
    switch (type) {
      case 'web':
        return <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-500 dark:text-blue-400"><GlobeIcon className="w-5 h-5" /></div>;
      case 'pdf':
        return <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-500 dark:text-red-400"><FileTextIcon className="w-5 h-5" /></div>;
      case 'audio':
        return <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-500 dark:text-purple-400"><HeadphonesIcon className="w-5 h-5" /></div>;
      case 'text':
        return <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-500 dark:text-green-400"><TypeIcon className="w-5 h-5" /></div>;
      case 'translation':
        return <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-500 dark:text-amber-400"><LanguagesIcon className="w-5 h-5" /></div>;
      default:
        return <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500"><HistoryIcon className="w-5 h-5" /></div>;
    }
  };

  // Modal for viewing complete summary
  const SummaryModal = ({ summary, onClose }: { summary: SummaryItem, onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {sourceTypeIcon(summary.sourceType)}
              <div>
                <h3 className="text-xl font-semibold">{summary.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(summary.createdAt)}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-4">
            {summary.sourceUrl && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source URL</h4>
                <a 
                  href={summary.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm break-all"
                >
                  {summary.sourceUrl}
                </a>
              </div>
            )}
            
            {summary.fileName && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Name</h4>
                <p className="text-sm">{summary.fileName}</p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Summary</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm">
                {summary.content}
              </div>
            </div>
            
            {summary.originalText && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original Content</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm max-h-48 overflow-y-auto">
                  {summary.originalText}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={() => handleDeleteSummary(summary.id!)}
              variant="destructive"
              className="mr-2"
              isLoading={isDeleting}
            >
              Delete
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container px-4 mx-auto max-w-5xl animate-fade-in">
        <div className="flex items-center mb-10">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl mr-4">
            <HistoryIcon className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">History</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Your saved summaries and translations</p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 animate-slide-up">
          {!user ? (
            // Not logged in state
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <UserIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">To save history, please log in</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">
                Login to view and manage your summarization history
              </p>
              <Link href="/auth">
                <Button>Log In</Button>
              </Link>
            </div>
          ) : isLoading ? (
            // Loading state
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <HistoryIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Loading your history...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-xl font-semibold">Your Saved Summaries</h2>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search summaries..."
                      className="pl-9 pr-4 py-2 w-full sm:w-64 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                  
                  <div className="relative">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="web">Web</option>
                      <option value="pdf">PDF</option>
                      <option value="audio">Audio</option>
                      <option value="text">Text</option>
                      <option value="translation">Translation</option>
                    </select>
                    <FilterIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              {filteredSummaries.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <HistoryIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                    {summaries.length === 0 ? "No history to display" : "No summaries found"}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 mt-1">
                    {searchTerm || filter !== 'all' 
                      ? "Try changing your search or filter"
                      : "Create summaries to see them in your history"}
                  </p>
                </div>
              ) : (
                <div className="space-y-5 h-96 overflow-y-auto">
                  {filteredSummaries.map((summary, index) => (
                    <div 
                      key={summary.id} 
                      className="p-5 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 hover-float animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        {sourceTypeIcon(summary.sourceType)}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h3 className="text-lg font-semibold truncate">{summary.title}</h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <ClockIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                              <span className="whitespace-nowrap">{formatDate(summary.createdAt)}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{summary.content}</p>
                          <div className="flex justify-between items-center mt-4">
                            <div className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full capitalize">
                              {summary.sourceType}
                            </div>
                            <div className="flex gap-2">
                              <button 
                                className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => setSelectedSummary(summary)}
                              >
                                <span className="sr-only">View Details</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                              </button>
                              <button 
                                className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => handleDeleteSummary(summary.id!)}
                                disabled={isDeleting}
                              >
                                <span className="sr-only">Delete</span>
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Summary detail modal */}
      <AnimatePresence>
        {selectedSummary && (
          <SummaryModal 
            summary={selectedSummary} 
            onClose={() => setSelectedSummary(null)} 
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
} 