'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setQuota } from '@/app/redux/features/quotaSlice';
import { useAuth } from '@/app/context/AuthContext';
import { AppDispatch } from '@/app/redux/store';
import { authFetch } from '@/app/lib/authFetch';

/**
 * A hook that periodically refreshes the quota status from the server
 * Use this to ensure the quota display is always up-to-date
 */
export const useQuotaRefresh = (intervalMs = 10000) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, isLoading } = useAuth();

    const refreshQuota = async () => {
        if (!user || !user.uid) {
            console.log('No user available, skipping quota refresh');
            return;
        }

        try {
            console.log('Refreshing quota status manually for user:', user.uid);
            const response = await authFetch(`/api/quota-status?userId=${user.uid}`);

            if (response.ok) {
                const data = await response.json();
                console.log('Refreshed quota status:', data);

                dispatch(setQuota({
                    used: data.count || 0,
                    limit: data.limit || 10
                }));
                console.log('Updated quota state from refresh');
            } else {
                console.warn('Failed to refresh quota:', await response.text());
            }
        } catch (error) {
            console.error('Error refreshing quota:', error);
        }
    };

    // Refresh quota on mount and when user changes - only when authenticated
    useEffect(() => {
        // Skip if still loading or no user
        if (isLoading || !user) {
            return;
        }

        refreshQuota();
    }, [isLoading, user]);

    // Set up periodic refresh - only when authenticated
    useEffect(() => {
        // Skip if no user
        if (!user) {
            return;
        }

        const interval = setInterval(() => {
            refreshQuota();
        }, intervalMs);

        return () => clearInterval(interval);
    }, [user, intervalMs]);

    return { refreshQuota };
}; 