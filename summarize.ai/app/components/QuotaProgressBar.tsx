'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { motion } from 'framer-motion';
import { fetchUserQuota } from '@/app/redux/features/quotaSlice';
import { Progress } from '@/app/components/ui/Progress';
import { useAuth } from '@/app/context/AuthContext';
import { AppDispatch } from '@/app/redux/store';
import { useQuotaRefresh } from '@/app/hooks/useQuotaRefresh';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

interface QuotaProgressBarProps {
  isCollapsed?: boolean;
}

const QuotaProgressBar = ({ isCollapsed = false }: QuotaProgressBarProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useAuth();
  const { used, limit, loading } = useSelector((state: RootState) => state.quota);
  const [color, setColor] = useState('bg-green-500');
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const { refreshQuota } = useQuotaRefresh(15000); // less frequent refresh to reduce API calls
  
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (used / limit) * 100));
  const remaining = limit - used;
  
  // Only fetch quota when we have a logged-in user
  useEffect(() => {
    if (!isLoading && user?.uid) {
      console.log('Fetching quota for user:', user.uid);
      dispatch(fetchUserQuota(user.uid));
    }
  }, [dispatch, user, isLoading]);

  // Only refresh when we have a logged-in user
  useEffect(() => {
    if (!isLoading && user?.uid) {
      console.log('Initial quota refresh for user:', user.uid);
      refreshQuota();
    }
  }, [user, isLoading]);

  useEffect(() => {
    // Update color based on percentage used
    if (percentage > 90) {
      setColor('bg-red-500'); // #EF4444
    } else if (percentage > 70) {
      setColor('bg-yellow-500'); // #FBBF24
    } else {
      setColor('bg-green-500'); // #22C55E
    }
    
    // Only show warnings when we have a user
    if (user && remaining === 1 && !hasShownWarning) {
      toast(
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span>You have 1 request remaining today.</span>
        </div>,
        {
          duration: 5000,
          id: 'quota-warning',
          style: {
            border: '1px solid #F0C33C',
            padding: '12px',
            color: '#713b17',
          },
          icon: '⚠️',
        }
      );
      setHasShownWarning(true);
    }
    
    // Reset warning flag when quota is reset
    if (remaining > 1) {
      setHasShownWarning(false);
    }
  }, [percentage, remaining, hasShownWarning, user]);

  // Add a button to manually refresh quota (helpful for debugging)
  const handleManualRefresh = () => {
    if (user?.uid) {
      console.log('Manual quota refresh requested');
      refreshQuota();
    }
  };

  // Don't render anything if no user is logged in
  if (!user) {
    return null;
  }

  // Simplified display for collapsed sidebar
  if (isCollapsed) {
    return (
      <div className="quota-container w-full px-2 mt-1">
        <div className="progress-bar-bg">
          <Progress 
            value={percentage} 
            className="h-2 bg-muted/50" 
            indicatorClassName={`progress-bar-fill ${color} transition-all duration-500`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="quota-container w-full px-2">
      <div className="flex justify-between items-center mb-2">
        <p className="quota-label text-sm text-muted-foreground">
          <span className="font-medium">Requests:</span> {used} / {limit}
        </p>
        {used >= limit ? (
          <span className="text-xs text-red-500 font-medium">Limit reached</span>
        ) : remaining === 1 ? (
          <span className="text-xs text-yellow-500 font-medium">1 left</span>
        ) : (
        <></>
        )}
      </div>
      <div className="progress-bar-bg">
        <Progress 
          value={percentage} 
          className="h-2 bg-muted/50" 
          indicatorClassName={`progress-bar-fill ${color} transition-all duration-500`}
        />
      </div>
      {used >= limit && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-muted-foreground text-center"
        >
          Come back tomorrow
        </motion.div>
      )}
      {remaining === 1 && !(used >= limit) && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-yellow-500 text-center"
        >
          Last request for today
        </motion.div>
      )}
    </div>
  );
};

export default QuotaProgressBar; 