import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const progressInterval = useRef(null);
  const timerInterval = useRef(null);
  const startTime = useRef(null);
  const estimatedDuration = 20 * 60 * 1000; // 20 minutes in milliseconds

  const startLoading = (message = 'Loading...') => {
    setProgress(0);
    setLoadingMessage(message);
    setElapsedTime(0);
    startTime.current = Date.now();
    
    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    // Start simulated progress
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const simulatedProgress = Math.min(95, (elapsed / estimatedDuration) * 100);
      setProgress(simulatedProgress);
    }, 1000); // Update every second
    // Start timer
    timerInterval.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const updateProgress = (value) => {
    setProgress(Math.min(100, Math.max(0, value)));
  };

  const stopLoading = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    setProgress(0);
    setLoadingMessage('');
    // Do not reset elapsedTime here so it can be displayed after processing
    startTime.current = null;
  };

  const resetElapsedTime = () => {
    setElapsedTime(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ 
      progress, 
      loadingMessage, 
      startLoading, 
      stopLoading,
      updateProgress,
      elapsedTime,
      resetElapsedTime
    }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}; 