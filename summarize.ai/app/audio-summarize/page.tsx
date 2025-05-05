'use client';

// Dynamic directive for Vercel deployment
export const dynamic = 'force-dynamic';

import React, { useState, useRef } from 'react';
import { 
  Mic, 
  Upload, 
  FileCheck, 
  Loader2, 
  ClipboardCopy,
  X,
  Download,
  AlertCircle,
  FileText,
  HelpCircle
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { AudioIllustration } from '../components/ui/illustrations/FeatureIllustrations';
import { cn } from '../lib/utils';
import { saveSummary } from '../firebase/history';
import { getCurrentUser } from '../firebase/auth';
import { Toaster, toast } from 'react-hot-toast';
import { useFeatureQuota } from '@/app/hooks/useFeatureQuota';

export default function AudioSummarizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptField, setShowPromptField] = useState(false);
  const [summary, setSummary] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Use our feature quota hook
  const { checkQuotaAvailable, incrementQuota } = useFeatureQuota('audioSummarize');

  const supportedFormats = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 
    'audio/webm', 'audio/mp4', 'audio/aac', 'audio/m4a'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && supportedFormats.includes(uploadedFile.type)) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      setError(null);
      setSummary('');
      setTranscript('');
    } else if (uploadedFile) {
      setError('Please upload a supported audio file format (MP3, WAV, OGG, etc.)');
      e.target.value = '';
      setFileName('');
      setFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (supportedFormats.includes(droppedFile.type)) {
        setFile(droppedFile);
        setFileName(droppedFile.name);
        setError(null);
        setSummary('');
        setTranscript('');
      } else {
        setError('Please upload a supported audio file format (MP3, WAV, OGG, etc.)');
      }
    }
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileName('');
    setFile(null);
    setError(null);
    setSummary('');
    setTranscript('');
  };

  const handleSummarize = async () => {
    if (!file) return;
    
    try {
      // Check if quota is available first
      const hasQuota = await checkQuotaAvailable();
      if (!hasQuota) return;
      
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
      setTranscript('');
      setProgress(0);
      
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Add custom prompt if provided
      if (customPrompt.trim()) {
        formData.append('customPrompt', customPrompt.trim());
      }
      
      // Start progress indicator for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 200);
      
      // Update processing stage
      setStage('Transcribing audio...');
      setProgress(10);
      
      try {
        // Call the API endpoint to process the audio file
        const response = await fetch('/api/audio', {
          method: 'POST',
          body: formData,
          signal
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process audio');
        }
        
        // Update processing stage
        setStage('Generating summary...');
        setProgress(70);
        
        // Get the transcript and summary from the response
        const data = await response.json();
        setTranscript(data.transcript);
        setSummary(data.summary);
        setProgress(100);
        
        // Increment quota after successful summarization
        await incrementQuota();
        
        // Save to history if user is logged in
        const user = getCurrentUser();
        if (user) {
          try {
            await saveSummary({
              title: file.name.replace(/\.(mp3|wav|ogg|m4a)$/i, '') || 'Audio Summary',
              content: data.summary,
              sourceType: 'audio',
              createdAt: Date.now(),
              originalText: data.transcript,
              fileName: file.name
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
      console.error('Audio summarization error:', error);
      
      // Don't show errors if the request was aborted
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      setError(error.message || 'Failed to transcribe and summarize audio. Please try again.');
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

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Audio Summarizer</h1>
            <p className="text-muted-foreground max-w-2xl">
              Upload any audio file to transcribe and generate a concise summary of its content.
              Our AI will analyze the speech and extract key information.
            </p>
          </div>
          <div className="p-6 rounded-xl">
            <AudioIllustration className="w-52 h-52" />
          </div>
        </div>
        
        {/* File Upload Section */}
        <Card className="mb-10 glass animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#F7F9EF] dark:bg-[#5F8729]/20">
                <Upload className="h-6 w-6 text-[#5F8729]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Upload Audio</h2>
                <p className="text-sm text-muted-foreground">Select the audio file you want to transcribe and summarize</p>
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
              <label 
                htmlFor="audio-upload" 
                className={cn(
                  "border-2 border-dashed border-muted rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer transition-all",
                  "bg-[#F7F9EF]/50 dark:hover:bg-[#5F8729]/10",
                  fileName && "border-[#8EB454] bg-[#F7F9EF]/50 dark:border-[#5F8729] dark:bg-[#5F8729]/10"
                )}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input 
                  id="audio-upload" 
                  type="file" 
                  ref={fileInputRef}
                  accept="audio/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                {fileName ? (
                  <div className="flex flex-col items-center text-center px-4">
                    <FileCheck className="h-10 w-10 text-[#5F8729] mb-2" />
                    <p className="font-medium text-foreground">{fileName}</p>
                    <p className="text-xs text-muted-foreground mt-1">Audio file selected ({(file?.size || 0) / 1024 / 1024 < 0.1 ? '<0.1' : ((file?.size || 0) / 1024 / 1024).toFixed(1)} MB)</p>
                    <button 
                      className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                      onClick={(e) => {
                        e.preventDefault();
                        clearFile();
                      }}
                    >
                      <X className="h-3 w-3" /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center px-4">
                    <Mic className="h-10 w-10 text-[#5F8729] mb-2 opacity-70" />
                    <p className="font-medium">Drag and drop your audio file here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
                    <p className="text-xs text-muted-foreground mt-4">Supported formats: MP3, WAV, OGG, M4A, etc.</p>
                  </div>
                )}
              </label>
              
              {/* Custom prompt toggle and field */}
              {fileName && (
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
              
              {showPromptField && fileName && (
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
                    placeholder="E.g., 'Focus on action items mentioned' or 'Format as meeting notes with bullet points'"
                    className="w-full px-4 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px] resize-y"
                    disabled={loading}
                  />
                </div>
              )}
              
              {loading && (
                <div className="w-full mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {stage || 'Processing audio...'}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                {loading && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (abortControllerRef.current) {
                        abortControllerRef.current.abort();
                        abortControllerRef.current = null;
                      }
                      setLoading(false);
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={handleSummarize} 
                  disabled={!fileName || loading}
                  className="hover-glow bg-[#5F8729] hover:bg-[#4A6C1E]"
                  isLoading={loading}
                >
                  Transcribe & Summarize
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Transcript Section */}
        {transcript && !loading && (
          <Card className="mb-10 glass animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#F7F9EF] dark:bg-[#5F8729]/20">
                  <FileText className="h-6 w-6 text-[#5F8729]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Transcription</h2>
                  <p className="text-sm text-muted-foreground">Audio content converted to text</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-foreground">{transcript}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Output Section */}
        {summary && !loading && (
          <Card className="glass animate-scale-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                  <FileCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Summary</h2>
                  <p className="text-sm text-muted-foreground">
                    AI-generated summary of the audio content
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
  );
} 