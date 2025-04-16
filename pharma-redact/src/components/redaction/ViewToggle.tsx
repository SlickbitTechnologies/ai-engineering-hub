"use client";

import React from 'react';

interface ViewToggleProps {
  view: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
  className?: string;
}

/**
 * Component to toggle between list and grid views
 */
export function ViewToggle({ view, onViewChange, className = '' }: ViewToggleProps) {
  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`}>
      <button
        type="button"
        className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium focus:z-10 focus:outline-none ${
          view === 'list'
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
        }`}
        onClick={() => onViewChange('list')}
      >
        <svg 
          className="mr-1.5 h-4 w-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 10h16M4 14h16M4 18h16" 
          />
        </svg>
        List
      </button>
      <button
        type="button"
        className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium focus:z-10 focus:outline-none ${
          view === 'grid'
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
        }`}
        onClick={() => onViewChange('grid')}
      >
        <svg 
          className="mr-1.5 h-4 w-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
          />
        </svg>
        Grid
      </button>
    </div>
  );
} 