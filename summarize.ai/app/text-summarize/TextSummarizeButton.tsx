'use client';

import React from 'react';
import { QuotaAwareButton } from '@/app/components/QuotaAwareButton';
import { incrementUserQuota } from '@/app/redux/features/quotaSlice';
import { useAuth } from '@/app/context/AuthContext';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/app/redux/store';
import { showQuotaExceededToast } from '@/app/components/QuotaExceededToast';

interface TextSummarizeButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

export default function TextSummarizeButton({ isLoading, onClick }: TextSummarizeButtonProps) {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  
  const handleSummarize = async () => {
    if (user?.uid) {
      try {
        // This will automatically check if quota is exceeded
        await dispatch(incrementUserQuota(user.uid)).unwrap();
        onClick();
      } catch (error: any) {
        if (error.includes('Daily quota exceeded')) {
          showQuotaExceededToast();
        }
      }
    }
  };
  
  return (
    <QuotaAwareButton
      variant="success"
      size="lg"
      isLoading={isLoading}
      onClick={handleSummarize}
      className="mt-4 w-full"
    >
      Generate Summary
    </QuotaAwareButton>
  );
} 