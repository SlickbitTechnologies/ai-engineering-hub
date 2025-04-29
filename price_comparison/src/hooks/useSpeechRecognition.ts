'use client';

import { useState, useRef } from 'react';

interface SpeechRecognitionOptions {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({ onResult, onError }: SpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const error = 'Speech recognition is not supported in this browser.';
      console.error(error);
      onError?.(error);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      
      recognition.onerror = (e: any) => {
        setListening(false);
        const errorMessage = e.error === 'not-allowed' 
          ? 'Microphone access denied. Please allow microphone access and try again.'
          : `Speech recognition error: ${e.error}`;
        onError?.(errorMessage);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Transcript:', transcript);
        onResult(transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start speech recognition';
      console.error(error);
      onError?.(error);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    console.log('Stopped listening');
    setListening(false);
  };

  return { listening, startListening, stopListening };
} 