'use client';

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  FileCheck, 
  Loader2, 
  ClipboardCopy,
  X,
  Download,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { PDFIllustration } from '../components/ui/illustrations/FeatureIllustrations';
import { cn } from '../lib/utils';

export default function PDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptField, setShowPromptField] = useState(false);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      setError(null);
      setSummary('');
      setExtractedText(null);
    } else if (uploadedFile) {
      setError('Please upload a PDF file');
      e.target.value = '';
      setFileName('');
      setFile(null);
    }
  };

  const handleSummarize = async () => {
    if (!file) return;
    
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
      setExtractedText(null);
      setProgress(0);
      
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Add custom prompt if provided
      if (customPrompt.trim()) {
        formData.append('customPrompt', customPrompt.trim());
      }
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 2;
        });
      }, 300);
      
      console.log('Sending file to API:', file.name, file.size);
      
      // Send the file to our server-side API
      const response = await fetch('/api/pdf-extract', {
        method: 'POST',
        body: formData,
        signal
      });
      
      // Clear the progress interval
      clearInterval(progressInterval);
      
      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = 'Failed to process PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse the response
      setProgress(95);
      
      // Get the response with summary
      const data = await response.json();
      
      // If we have extracted text, store it
      if (data.text) {
        setExtractedText(data.text);
      }
      
      // If we have a summary, show it
      if (data.summary) {
        setSummary(data.summary);
        setProgress(100);
      } else {
        throw new Error('No summary was generated');
      }
    } catch (error: any) {
      console.error('PDF summarization error:', error);
      
      // Don't show errors if the request was aborted
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      setError(error.message || 'Failed to summarize PDF. Please try again.');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
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
    setExtractedText(null);
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
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">PDF Summarizer</h1>
            <p className="text-muted-foreground max-w-2xl">
              Upload any PDF document to generate a concise summary of its contents. 
              Our AI will extract key information and main points.
            </p>
          </div>
          <PDFIllustration className="w-48 h-40 md:w-60 md:h-48 animate-scale-in" />
        </div>
        
        {/* File Upload Section */}
        <Card className="mb-10 glass animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#ECFAD6]/80 dark:bg-[#3D5321]/70">
                <FileText className="h-6 w-6 text-[#7CAA38]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Upload PDF</h2>
                <p className="text-sm text-muted-foreground">Select the PDF file you want to summarize</p>
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
            
            <div className="flex flex-col gap-4">
              <label 
                htmlFor="pdf-upload" 
                className={cn(
                  "border-2 border-dashed border-muted rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer transition-all",
                  "border-primary/50 hover:bg-muted/30",
                  fileName && "border-primary/50 bg-primary/5"
                )}
              >
                <input 
                  id="pdf-upload" 
                  type="file" 
                  ref={fileInputRef}
                  accept="application/pdf" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                {fileName ? (
                  <div className="flex flex-col items-center text-center px-4">
                    <FileCheck className="h-10 w-10 text-primary mb-2" />
                    <p className="font-medium text-foreground">{fileName}</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF file selected ({(file?.size || 0) / 1024 / 1024 < 0.1 ? '<0.1' : ((file?.size || 0) / 1024 / 1024).toFixed(1)} MB)</p>
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
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="font-medium">Drag and drop your PDF here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
                  </div>
                )}
              </label>
              
              {/* Custom prompt toggle and field */}
              {fileName && (
                <div className="flex items-center">
                  <button 
                    type="button" 
                    onClick={() => setShowPromptField(!showPromptField)}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
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
                    placeholder="E.g., 'Extract the key technical details' or 'Summarize for a non-technical audience'"
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
                    {progress < 50 ? 'Extracting text from PDF...' : 
                     progress < 95 ? 'Processing content...' : 
                     'Generating summary...'}
                  </p>
                </div>
              )}
              
              {/* Show a preview of extracted text if available */}
              {extractedText && !loading && !error && (
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Extracted Text Preview:</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic overflow-hidden text-ellipsis">
                    {extractedText.substring(0, 200)}...
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
                  className="hover-glow"
                  isLoading={loading}
                >
                  Summarize PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Output Section */}
        {(summary || loading) && (
          <Card className={cn(
            "glass animate-scale-in overflow-hidden", 
            loading ? "border-blue-200 dark:border-blue-900" : "border-green-200 dark:border-green-900"
          )}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  loading ? "bg-blue-50 dark:bg-blue-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"
                )}>
                  {loading ? (
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  ) : (
                    <FileCheck className="h-6 w-6 text-emerald-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {loading ? "Analyzing PDF..." : "PDF Summary"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {loading 
                      ? "Our AI is extracting key information from your document" 
                      : fileName ? `Summary of ${fileName}` : "Document summary"}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
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
                    } else if (line.length === 0) {
                      return <div key={index} className="h-4"></div>;
                    } else {
                      return <p key={index} className="mb-4">{line}</p>;
                    }
                  })}
                </div>
              )}
            </CardContent>
            {!loading && summary && (
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
            )}
          </Card>
        )}
      </div>
    </MainLayout>
  );
} 