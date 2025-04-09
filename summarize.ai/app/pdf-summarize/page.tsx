'use client';

import React, { useState, useRef } from 'react';
import MainLayout from '../components/MainLayout';
import { FileTextIcon, UploadIcon, SparklesIcon, FileIcon, AlertCircleIcon } from 'lucide-react';
import { saveSummary } from '../firebase/history';
import { getCurrentUser } from '../firebase/auth';
import { Toaster, toast } from 'react-hot-toast';

export default function PdfSummarizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileValidation(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileValidation(e.target.files[0]);
    }
  };

  const handleFileValidation = (fileToValidate: File) => {
    // Reset states
    setError(null);
    setSummary(null);
    setExtractedText(null);
    
    // Check if file is PDF
    if (fileToValidate.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    
    // Check file size (10MB limit)
    if (fileToValidate.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }
    
    setFile(fileToValidate);
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsLoading(false);
    setStage('');
    setProgress(0);
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
      setIsLoading(true);
      setError(null);
      setSummary(null);
      setExtractedText(null);
      setProgress(0);
      
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);
      
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
      
      setStage('Uploading and extracting text from PDF');
      
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
      setStage('Processing summary');
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
        
        // Save to history if user is logged in
        const user = getCurrentUser();
        if (user) {
          try {
            await saveSummary({
              title: file.name.replace('.pdf', ''),
              content: data.summary,
              sourceType: 'pdf',
              createdAt: Date.now(),
              originalText: data.text,
              fileName: file.name
            });
            toast.success('Summary saved to history');
          } catch (error) {
            console.error('Error saving to history:', error);
            // Don't show error toast since the summarization succeeded
          }
        }
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
      setIsLoading(false);
      setStage('');
      abortControllerRef.current = null;
    }
  };

  return (
    <MainLayout>
      <div className="container px-4 mx-auto max-w-5xl animate-fade-in">
        <div className="flex items-center mb-10">
          <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-xl mr-4">
            <FileTextIcon className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">PDF Summarize</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Extract key insights from PDF documents</p>
          </div>
        </div>
        
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 mb-8 animate-slide-up">
          <div className="flex items-center gap-2 mb-6">
            <UploadIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Upload PDF</h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Upload a PDF file to extract and summarize its content with our intelligent AI technology.
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          <div 
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all ${
              isDragging 
                ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                : file 
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileIcon className="w-8 h-8 text-green-500 dark:text-green-400" />
                </div>
                <p className="text-gray-800 dark:text-gray-200 font-medium mb-1">{file.name}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button 
                  onClick={() => setFile(null)}
                  className="text-sm text-red-500 hover:text-red-600 dark:hover:text-red-400 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <UploadIcon className="w-14 h-14 text-gray-400 mb-4" />
                <p className="text-center text-gray-600 dark:text-gray-400 mb-2 font-medium">
                  Drag and drop your PDF file here, or click to browse
                </p>
                <p className="text-center text-gray-500 dark:text-gray-500 text-sm mb-6">
                  PDF files up to 10MB
                </p>
              </>
            )}
            
            {!file && (
              <label className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                Choose File
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".pdf,application/pdf" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
          
          {file && (
            <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={handleSummarize}
                disabled={isLoading}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:shadow-md hover-float transition-all flex items-center disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {stage || 'Processing PDF...'}
                  </>
                ) : (
                  <>Summarize PDF</>
                )}
              </button>
              
              {isLoading && (
                <button
                  onClick={cancelProcessing}
                  className="px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
          
          {isLoading && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">{stage}</p>
            </div>
          )}
          
          {/* Show a preview of extracted text if available */}
          {extractedText && !isLoading && !error && (
            <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Extracted Text Preview:</h3>
              <p className="text-xs text-gray-500 dark:text-gray-500 italic overflow-hidden text-ellipsis">
                {extractedText.substring(0, 300)}...
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2 mb-6">
            <SparklesIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Summary</h2>
          </div>
          
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl min-h-64 max-h-96 overflow-y-auto">
            {summary ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {summary.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Upload a PDF file to generate a summary<br />
                <span className="text-sm mt-2 block text-gray-400 dark:text-gray-500">The summary will appear here</span>
              </p>
            )}
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </MainLayout>
  );
} 