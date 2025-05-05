'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';

export const showQuotaExceededToast = () => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-in-right' : 'animate-slide-in-left'
        } max-w-md w-full bg-primary text-white shadow-lg rounded-xl pointer-events-auto flex justify-between items-center p-4`}
      >
        <div className="font-medium">
          You&apos;ve reached 10 requests today. For unlimited requests, upgrade—or come back tomorrow for 10 more.
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="p-1 rounded-md hover:bg-green-700 focus:outline-none focus:ring-1"
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    ),
    { 
      duration: 5000,
      position: 'top-center'
    }
  );
};

export const useQuotaCheck = () => {
  const { used, limit } = useSelector((state: RootState) => state.quota);
  
  const checkQuota = (): boolean => {
    if (used >= limit) {
      showQuotaExceededToast();
      return false;
    }
    return true;
  };
  
  return { 
    checkQuota,
    isQuotaAvailable: used < limit
  };
}; 