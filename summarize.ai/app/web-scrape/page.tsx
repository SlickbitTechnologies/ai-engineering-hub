'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  FileText, 
  Loader2, 
  ClipboardCopy,
  AlertTriangle,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import MainLayout from '@/app/components/MainLayout';
import { Button } from '@/app/components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/app/components/ui/Card';
import { WebScraperIllustration } from '@/app/components/ui/illustrations/FeatureIllustrations';
import { cn } from '@/app/lib/utils';

export default function WebScrapePage() {
  const [url, setUrl] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptField, setShowPromptField] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setSummary('');
    
    // Validate URL
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    try {
      new URL(url);
    } catch (err) {
      setError('Please enter a valid URL');
      return;
    }
    
    try {
      setIsLoading(true);
      setProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 300);
      
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          customPrompt: customPrompt.trim() || undefined
        }),
      });
      
      // Clear the progress interval
      clearInterval(progressInterval);
      setProgress(95);
      
      const data = await response.json();
      
      if (response.ok) {
        setSummary(data.summary || '');
        setProgress(100);
      } else {
        setError(data.error || 'Failed to scrape and summarize the webpage');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    
    navigator.clipboard.writeText(summary);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Web Scraper</h1>
            <p className="text-muted-foreground max-w-2xl">
              Enter any URL to scrape and summarize the content of webpages.
              Our AI will extract key information and provide a concise summary.
            </p>
          </div>
          <WebScraperIllustration className="w-48 h-40 md:w-60 md:h-48 animate-scale-in" />
        </div>
        
        {/* URL Input Section */}
        <Card className="mb-10 glass animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#ECFAD6]/80 dark:bg-[#3D5321]/70">
                <Globe className="h-6 w-6 text-[#7CAA38]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Website URL</h2>
                <p className="text-sm text-muted-foreground">Enter the URL you want to scrape and summarize</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col space-y-2">
                  <input
                    id="url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex items-center">
                  <button 
                    type="button" 
                    onClick={() => setShowPromptField(!showPromptField)}
                    className="flex items-center gap-1 text-sm text-[#7CAA38] hover:text-[#5F8729] transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    {showPromptField ? "Hide custom prompt" : "Add custom prompt"}
                  </button>
                </div>
                
                {showPromptField && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="custom-prompt" className="text-sm text-muted-foreground">
                        Custom Prompt (Optional)
                      </label>
                      <div className="text-xs text-muted-foreground">
                        {customPrompt.length} / 500 characters
                      </div>
                    </div>
                    <textarea
                      id="custom-prompt"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value.slice(0, 500))}
                      placeholder="E.g., 'Summarize this in bullet points' or 'Focus on the technical aspects'"
                      className="w-full px-4 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px] resize-y"
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                {isLoading && (
                  <div className="w-full mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {progress < 50 ? 'Scraping webpage content...' : 
                      progress < 95 ? 'Processing content...' : 
                      'Generating summary...'}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-3">
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="hover-glow"
                    isLoading={isLoading}
                  >
                    Summarize Webpage
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Output Section */}
        {(summary || isLoading) && (
          <Card className={cn(
            "glass animate-scale-in overflow-hidden", 
            isLoading ? "border-blue-200 dark:border-blue-900" : "border-green-200 dark:border-green-900"
          )}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  isLoading ? "bg-blue-50 dark:bg-blue-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"
                )}>
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  ) : (
                    <FileCheck className="h-6 w-6 text-emerald-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {isLoading ? "Analyzing Webpage..." : "Webpage Summary"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isLoading 
                      ? "Our AI is extracting key information from the webpage" 
                      : url ? `Summary of ${url}` : "Webpage summary"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4 py-6">
                  <div className="h-5 bg-muted rounded-full animate-shimmer w-1/3" />
                  <div className="h-4 bg-muted rounded-full animate-shimmer w-full" />
                  <div className="h-4 bg-muted rounded-full animate-shimmer w-4/5" />
                  <div className="h-5 bg-muted rounded-full animate-shimmer w-1/4 mt-8" />
                  <div className="h-4 bg-muted rounded-full animate-shimmer w-full" />
                  <div className="h-4 bg-muted rounded-full animate-shimmer w-3/4" />
                  <div className="h-4 bg-muted rounded-full animate-shimmer w-4/5" />
                </div>
              ) : (
                <div className="py-4 prose prose-sm dark:prose-invert max-w-none">
                  {summary.split('\n').map((line, index) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="text-2xl font-bold mt-6 mb-4">{line.replace('# ', '')}</h1>;
                    } else if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-xl font-semibold mt-5 mb-3">{line.replace('## ', '')}</h2>;
                    } else if (line.startsWith('- ')) {
                      return <li key={index} className="ml-6 mb-2">{line.replace('- ', '')}</li>;
                    } else if (line.match(/^\d+\.\s/)) {
                      return <li key={index} className="ml-6 mb-2">{line}</li>;
                    } else if (line.length === 0) {
                      return <div key={index} className="h-4"></div>;
                    } else {
                      return <p key={index} className="mb-4">{line}</p>;
                    }
                  })}
                </div>
              )}
            </CardContent>
            {!isLoading && summary && (
              <CardFooter className="border-t border-border py-4 px-6 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  leftIcon={<ClipboardCopy className="h-4 w-4" />}
                >
                  {copied ? "Copied!" : "Copy Summary"}
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
      </div>
    </MainLayout>
  );
} 