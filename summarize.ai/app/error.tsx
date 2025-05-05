'use client';

import { useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="text-xl mb-8 max-w-lg">
        We apologize for the inconvenience. The application encountered an unexpected error.
      </p>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        <Button
          onClick={() => window.location.href = '/'}
          variant="outline"
          size="lg"
        >
          Go to Home
        </Button>
        
        <Button
          onClick={() => reset()}
          variant="default"
          size="lg"
        >
          Try Again
        </Button>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-md max-w-2xl overflow-auto text-left">
          <h3 className="font-bold mb-2">Error details:</h3>
          <p className="font-mono text-sm">{error.message}</p>
          {error.digest && (
            <p className="font-mono text-sm mt-2">Digest: {error.digest}</p>
          )}
          {error.stack && (
            <pre className="mt-4 text-xs overflow-x-auto">{error.stack}</pre>
          )}
        </div>
      )}
    </div>
  );
} 