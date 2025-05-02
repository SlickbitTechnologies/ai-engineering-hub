import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/redux/store';
import { fetchUserQuota } from '@/app/redux/features/quotaSlice';
import { useAuth } from '@/app/context/AuthContext';
import toast from 'react-hot-toast';

type FeatureType =
    | 'webScrape'
    | 'pdfSummarize'
    | 'audioSummarize'
    | 'textSummarize'
    | 'youtubeSummarize'
    | 'translate'
    | 'other';

/**
 * Custom hook for managing feature-specific quota usage
 * 
 * @param feature - The feature being used
 * @returns Object with quota state and functions
 */
export const useFeatureQuota = (feature: FeatureType) => {
    const { user } = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const { used, limit, loading } = useSelector((state: RootState) => state.quota);
    const [isCheckingQuota, setIsCheckingQuota] = useState(false);

    /**
     * Check if the user has available quota for an operation
     * @returns True if quota is available, false if exceeded
     */
    const checkQuotaAvailable = useCallback(async (): Promise<boolean> => {
        if (!user?.uid) {
            toast.error('Please log in to use this feature.');
            return false;
        }

        setIsCheckingQuota(true);

        try {
            // Refresh quota from API to ensure it's current
            await dispatch(fetchUserQuota(user.uid));

            // Get the latest quota from Redux store
            const state = (dispatch as any).getState() as RootState;
            const currentQuota = state.quota;

            if (currentQuota.used >= currentQuota.limit) {
                toast.error(`You've reached your daily limit of ${currentQuota.limit} requests. Please try again tomorrow.`, {
                    id: 'quota-exceeded',
                    duration: 5000
                });
                return false;
            }

            // If we have just 1 request left, warn the user
            if (currentQuota.limit - currentQuota.used === 1) {
                toast("This is your last request for today.", {
                    id: 'last-request',
                    icon: '⚠️',
                    duration: 4000
                });
            }

            return true;
        } catch (error) {
            console.error('Error checking quota:', error);
            // If there's an error checking quota, allow the operation
            // but log the error
            return true;
        } finally {
            setIsCheckingQuota(false);
        }
    }, [user, dispatch]);

    /**
     * Increment the quota after a successful operation
     */
    const incrementQuota = useCallback(async (): Promise<void> => {
        if (!user?.uid) return;

        try {
            const response = await fetch('/api/increment-quota', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.uid,
                    feature: feature
                }),
            });

            const data = await response.json();

            if (!data.success && data.exceeded) {
                toast.error(`You've reached your daily limit of ${limit} requests. Please try again tomorrow.`, {
                    id: 'quota-exceeded',
                    duration: 5000
                });
            }

            // Refresh quota in Redux store
            dispatch(fetchUserQuota(user.uid));
        } catch (error) {
            console.error('Error incrementing quota:', error);
        }
    }, [user, feature, limit, dispatch]);

    /**
     * Refresh the quota from the server
     */
    const refreshQuota = useCallback(async (): Promise<void> => {
        if (user?.uid) {
            dispatch(fetchUserQuota(user.uid));
        }
    }, [user, dispatch]);

    return {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        isExceeded: used >= limit,
        isCheckingQuota,
        isLoading: loading,
        checkQuotaAvailable,
        incrementQuota,
        refreshQuota
    };
}; 