'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Languages, 
  ClipboardCopy,
  Delete, 
  ArrowRight,
  ArrowLeft,
  ArrowDownUp,
  AlertCircle,
  Check,
  RefreshCw,
  Copy,
  ArrowLeftRight,
  Trash
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import { TranslateIllustration } from '../components/ui/illustrations/FeatureIllustrations';
import { cn } from '../lib/utils';
import debounce from 'lodash/debounce';
import { saveSummary } from '../firebase/history';
import { getCurrentUser } from '../firebase/auth';
import { Toaster, toast } from 'react-hot-toast';

// Define available languages
const languages = [
  { value: 'auto', label: 'Detect Language' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'nl', label: 'Dutch' },
  { value: 'tr', label: 'Turkish' },
  { value: 'pl', label: 'Polish' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'th', label: 'Thai' },
  { value: 'te', label: 'Telugu' },
];

// Language detection debounce time (ms)
const DETECTION_DEBOUNCE = 1000;

export default function TranslatePage() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [stage, setStage] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Character and word count calculation
  const sourceCharCount = sourceText.length;
  const sourceWordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const translatedCharCount = translatedText.length;
  const translatedWordCount = translatedText.trim() ? translatedText.trim().split(/\s+/).length : 0;
  
  // Debounced language detection
  const debouncedDetectLanguage = useCallback(
    (text: string) => {
      if (text.length < 10 || sourceLanguage !== 'auto') return;
      
      // Clear any previous detection timeouts
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
      
      // Set a new timeout for detection
      detectionTimeoutRef.current = setTimeout(async () => {
        try {
          setIsDetectingLanguage(true);
          setStage('Detecting language...');
          const response = await fetch('/api/detect-language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });
          
          if (!response.ok) throw new Error('Language detection failed');
          
          const data = await response.json();
          if (data.language) {
            setDetectedLanguage(data.language);
            console.log('Detected language:', data.language);
          }
        } catch (err) {
          console.error('Error detecting language:', err);
        } finally {
          setIsDetectingLanguage(false);
          setStage('');
        }
      }, DETECTION_DEBOUNCE);
    },
    [sourceLanguage]
  );
  
  // Handle source text change and trigger language detection
  const handleSourceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setSourceText(newText);
    setError('');
    
    // Auto-detect language if set to 'auto'
    if (sourceLanguage === 'auto' && newText.length >= 10) {
      debouncedDetectLanguage(newText);
    }
  };
  
  // Detect language manually
  const detectLanguage = async () => {
    if (sourceText.length < 10) {
      setError('Please enter at least 10 characters for language detection');
      return;
    }
    
    try {
      setIsDetectingLanguage(true);
      setStage('Detecting language...');
      const response = await fetch('/api/detect-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Language detection failed');
      }
      
      const data = await response.json();
      console.log('Language detection response:', data);
      
      if (data.language) {
        setDetectedLanguage(data.language);
        setSourceLanguage('auto'); // Ensure "Detect Language" is selected
        
        // Show feedback to user
        const langName = languages.find(l => l.value === data.language)?.label || data.language;
        setStage(`Detected: ${langName}`);
        setTimeout(() => setStage(''), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Error detecting language');
    } finally {
      setIsDetectingLanguage(false);
    }
  };

  const clearSourceText = () => {
    setSourceText('');
    setTranslatedText('');
    setError('');
    setProgress(0);
  };

  const swapLanguages = () => {
    if (sourceLanguage !== 'auto' && translatedText) {
      setSourceText(translatedText);
      setTranslatedText('');
      const temp = sourceLanguage;
      setSourceLanguage(targetLanguage);
      setTargetLanguage(temp);
    }
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.value === code)?.label || code;
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('Please enter some text to translate');
      return;
    }
    
    // If source language is set to auto but no language has been detected yet,
    // try to detect it first
    if (sourceLanguage === 'auto' && !detectedLanguage && sourceText.length >= 10) {
      setStage('Detecting language first...');
      setProgress(5);
      try {
        const response = await fetch('/api/detect-language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sourceText }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.language) {
            setDetectedLanguage(data.language);
            console.log('Detected language before translation:', data.language);
          }
        }
      } catch (err) {
        console.error('Error detecting language before translation:', err);
      }
    }
    
    try {
      setError('');
      setIsTranslating(true);
      setProgress(10);
      setStage('Preparing translation...');
      
      // Incremental progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Show different stages during translation
      setTimeout(() => setStage('Translating content...'), 800);
      setTimeout(() => setStage('Finalizing translation...'), 2000);
      
      // Call translation API
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          sourceLanguage: sourceLanguage === 'auto' ? detectedLanguage : sourceLanguage,
          targetLanguage,
        }),
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed');
      }
      
      const data = await response.json();
      setTranslatedText(data.translatedText);
      setProgress(100);
      setStage('Translation completed');
      
      setTimeout(() => {
        setProgress(0);
        setStage('');
      }, 1500);
      
      // Save translation to history if there is content and user is logged in
      if (data.translatedText && sourceText.trim().length > 0) {
        saveTranslationToHistory(
          sourceText, 
          data.translatedText, 
          detectedLanguage || 'Unknown', 
          targetLanguage
        );
      }
    } catch (err: any) {
      setError(err.message || 'Error translating text');
      setProgress(0);
      setStage('');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Add this function to save translation to history
  const saveTranslationToHistory = async (originalText: string, translatedText: string, fromLanguage: string, toLanguage: string) => {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
      const title = originalText.length > 50 
        ? `${originalText.substring(0, 50)}...` 
        : originalText;
        
      await saveSummary({
        title: `Translation: ${fromLanguage} to ${toLanguage}`,
        content: translatedText,
        sourceType: 'translation',
        createdAt: Date.now(),
        originalText: originalText,
      });
      
      toast.success('Translation saved to history');
    } catch (error) {
      console.error('Error saving translation to history:', error);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">AI Translator</h1>
            <p className="text-muted-foreground max-w-2xl">
              Translate text between multiple languages using our advanced AI translation engine.
              Perfect for documents, messages, or content in any language.
            </p>
          </div>
          <div className="p-6 rounded-xl">
            <TranslateIllustration className="w-52 h-52" />
          </div>
        </div>
        
        {/* Translation Interface */}
        <div className="mb-10 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          {/* Language Selection Bar */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-border flex items-center flex-wrap md:flex-nowrap gap-2">
            <div className="w-full md:w-[45%]">
              <Select
                value={sourceLanguage}
                onValueChange={setSourceLanguage}
              >
                <SelectTrigger className="border-0 bg-muted/50 hover:bg-muted focus:ring-0">
                  <SelectValue placeholder="Select source language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label} {sourceLanguage === 'auto' && detectedLanguage && lang.value === 'auto' ? 
                        `(Detected: ${languages.find(l => l.value === detectedLanguage)?.label || detectedLanguage})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-center mx-2">
              <Button
                variant="outline"
                size="icon"
                onClick={swapLanguages}
                disabled={isTranslating || sourceLanguage === 'auto'}
                className="rounded-full border border-[#5F8729]/25 dark:border-[#5F8729]/40"
              >
                <ArrowDownUp className="h-4 w-4 text-[#5F8729]" />
              </Button>
            </div>
            
            <div className="w-full md:w-[45%]">
              <Select
                value={targetLanguage}
                onValueChange={setTargetLanguage}
              >
                <SelectTrigger className="border-0 bg-muted/50 hover:bg-muted focus:ring-0">
                  <SelectValue placeholder="Select target language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.filter(lang => lang.value !== 'auto').map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Translation Text Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Text Area */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {sourceLanguage === 'auto' 
                        ? detectedLanguage 
                          ? `Detected: ${getLanguageName(detectedLanguage)}` 
                          : 'Detecting language...'
                        : getLanguageName(sourceLanguage)}
                    </span>
                    {isDetectingLanguage && (
                      <span className="inline-block h-3 w-3 rounded-full bg-[#5F8729] opacity-75 animate-pulse"></span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={clearSourceText}
                      disabled={!sourceText}
                    >
                      <Delete className="h-3.5 w-3.5 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
                <Textarea 
                  placeholder="Enter or paste text to translate..."
                  className="min-h-[240px] resize-y text-base border-0 focus-visible:ring-0 rounded-t-none"
                  value={sourceText}
                  onChange={handleSourceTextChange}
                />
                <div className="px-4 py-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {sourceText ? `${sourceWordCount} words | ${sourceCharCount} characters` : '0 / 5000 characters'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => handleCopy(sourceText)}
                    disabled={!sourceText}
                  >
                    <ClipboardCopy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Center Action Area (Mobile) */}
            <div className="md:hidden flex justify-center items-center my-2">
              <Button
                onClick={handleTranslate}
                disabled={!sourceText.trim() || isTranslating}
                className="bg-[#5F8729] hover:bg-[#4A6C1E]"
                isLoading={isTranslating}
              >
                Translate
              </Button>
            </div>
            
            {/* Target Text Area */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-border">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {getLanguageName(targetLanguage)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() => handleCopy(translatedText)}
                      disabled={!translatedText}
                    >
                      <ClipboardCopy className="h-3.5 w-3.5 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
                <Textarea
                  className="min-h-[240px] resize-y text-base border-0 focus-visible:ring-0 rounded-t-none bg-gray-50 dark:bg-gray-900"
                  value={translatedText}
                  readOnly
                  placeholder="Translation will appear here..."
                />
                <div className="px-4 py-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {translatedText ? `${translatedWordCount} words | ${translatedCharCount} characters` : '0 characters'}
                  </span>
                  {isTranslating && (
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-[#5F8729] h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">{stage || 'Translating...'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Center Action Area (Desktop) */}
          <div className="hidden md:flex justify-center items-center mt-4">
            <Button
              onClick={handleTranslate}
              disabled={!sourceText.trim() || isTranslating}
              className="bg-[#5F8729] hover:bg-[#4A6C1E] hover-glow"
              isLoading={isTranslating}
            >
              Translate
            </Button>
          </div>
        </div>
        
        {/* Languages List */}
        <div className="mb-10 animate-fade-in">
          <h2 className="text-xl font-semibold mb-3">Available Languages</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {languages.filter(lang => lang.value !== 'auto').map((lang) => (
              <div 
                key={lang.value} 
                className="px-3 py-2 bg-white dark:bg-gray-900 rounded-md border border-border text-sm hover:bg-[#5F8729]/10 cursor-pointer"
                onClick={() => setTargetLanguage(lang.value)}
              >
                {lang.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </MainLayout>
  );
} 