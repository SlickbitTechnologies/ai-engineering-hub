'use client';

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  ClipboardCopy, 
  Delete,
  AlertCircle,
  Check,
  Download,
  HelpCircle
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { TextIllustration } from '../components/ui/illustrations/FeatureIllustrations';
import { cn } from '../lib/utils';
import { saveSummary } from '../firebase/history';
import { getCurrentUser } from '../firebase/auth';
import { Toaster, toast } from 'react-hot-toast';
import { AuthGuard } from '../components/AuthGuard';
import { auth } from '../firebase/firebase';
import { getIdToken } from '../firebase/auth';

export default function TextSummarizePage() {
  const [text, setText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptField, setShowPromptField] = useState(false);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setError(null);
  };

  const clearText = () => {
    setText('');
    setSummary('');
    setError(null);
  };

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter some text to summarize.');
      return;
    }
    
    if (text.trim().length < 100) {
      setError('Please enter at least 100 characters for a meaningful summary.');
      return;
    }
    
    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new AbortController
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;
      
      // Reset states
      setLoading(true);
      setError(null);
      setSummary('');
      setProgress(0);
      setStage('Analyzing content...');
      
      // Start progress indicator for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 150);
      
      // Update stage
      setProgress(30);
      setStage('Processing text...');
      
      try {
        // Get authentication token - ensure user is authenticated
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('You must be logged in to use this feature');
        }
        
        // Use the getIdToken function from our auth module
        const token = await getIdToken(true); // Force token refresh
        if (!token) {
          throw new Error('Failed to get authentication token');
        }
        
        // Call the API endpoint
        const response = await fetch('/api/text-summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            text,
            customPrompt: customPrompt.trim() || undefined
          }),
          signal
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to summarize text');
        }
        
        setProgress(70);
        setStage('Generating summary...');
        
        // Get the summary from the response
        const data = await response.json();
        setSummary(data.summary);
        setProgress(100);
        
        // Save to history if user is logged in
        const user = getCurrentUser();
        if (user) {
          try {
            // Create a title from the first ~50 characters of the input text
            const title = text.length > 50 
              ? `${text.substring(0, 50)}...` 
              : text;
              
            await saveSummary({
              title: title,
              content: data.summary,
              sourceType: 'text',
              createdAt: Date.now(),
              originalText: text,
            });
            
            toast.success('Summary saved to history');
          } catch (error) {
            console.error('Error saving to history:', error);
            // Don't show error toast since the summarization succeeded
          }
        }
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.log('Request was aborted');
          return;
        }
        throw fetchError;
      } finally {
        // Clear the progress interval
        clearInterval(progressInterval);
      }
      
    } catch (error: any) {
      console.error('Text summarization error:', error);
      setError(error.message || 'Failed to summarize text. Please try again.');
    } finally {
      setLoading(false);
      setStage('');
      abortControllerRef.current = null;
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

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <AuthGuard>
      <MainLayout>
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 animate-fade-in">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Text Summarizer</h1>
              <p className="text-muted-foreground max-w-2xl">
                Enter any text to generate a concise, insightful summary. Perfect for articles, research papers, or any content you need to distill.
              </p>
            </div>
            <div className="p-6 rounded-xl">
              <TextIllustration className="w-52 h-52" />
            </div>
          </div>
          
          {/* Text Input Section */}
          <Card className="mb-10 glass animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#F7F9EF] dark:bg-[#5F8729]/20">
                  <FileText className="h-6 w-6 text-[#5F8729]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Enter Text</h2>
                  <p className="text-sm text-muted-foreground">Paste or type the content you want to summarize</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Textarea 
                    placeholder="Enter or paste your text here (minimum 100 characters for meaningful summary)..."
                    className="min-h-[240px] resize-y text-base"
                    value={text}
                    onChange={handleTextChange}
                  />
                  {text.trim().length > 0 && (
                    <div className="absolute bottom-2 right-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full opacity-70 hover:opacity-100"
                        onClick={clearText}
                      >
                        <Delete className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Custom prompt toggle and field */}
                {text.trim().length >= 100 && (
                  <div className="flex items-center">
                    <button 
                      type="button" 
                      onClick={() => setShowPromptField(!showPromptField)}
                      className="flex items-center gap-1 text-sm text-[#5F8729] hover:text-[#4A6C1E] transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                      {showPromptField ? "Hide custom prompt" : "Add custom prompt"}
                    </button>
                  </div>
                )}
                
                {showPromptField && text.trim().length >= 100 && (
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
                      placeholder="E.g., 'Focus on the main arguments' or 'Format as key takeaways with bullet points'"
                      className="w-full px-4 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px] resize-y"
                      disabled={loading}
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    {text ? `${getWordCount(text)} words | ${text.length} characters` : 'No text entered'}
                  </div>
                  
                  <Button 
                    onClick={handleSummarize} 
                    disabled={text.trim().length < 100 || loading}
                    className="hover-glow bg-[#5F8729] hover:bg-[#4A6C1E]"
                    isLoading={loading}
                  >
                    Summarize Text
                  </Button>
                </div>
                
                {loading && (
                  <div className="w-full mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {stage || 'Processing text...'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Output Section */}
          {summary && !loading && (
            <Card className="glass animate-scale-in">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#F7F9EF] dark:bg-[#5F8729]/20">
                    <Check className="h-6 w-6 text-[#5F8729]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Summary</h2>
                    <p className="text-sm text-muted-foreground">
                      AI-generated summary of your text
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
              <CardFooter className="border-t border-border py-4 px-6 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Download Summary
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopy}
                  leftIcon={<ClipboardCopy className="h-4 w-4" />}
                >
                  {copied ? "Copied!" : "Copy Summary"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        <Toaster position="bottom-right" />
      </MainLayout>
    </AuthGuard>
  );
} 