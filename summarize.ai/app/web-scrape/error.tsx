'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Web Scraper error:', error);
  }, [error]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong!</h2>
        <p className="text-red-700 mb-4">
          We encountered an error while processing your request.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-800 mb-3">You can try the following:</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Reload the page and try again</li>
          <li>Check your internet connection</li>
          <li>Try a different URL</li>
          <li>Return to the home page and try again later</li>
        </ul>
      </div>
    </div>
  );
} 