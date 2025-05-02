import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/firebase/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const QUOTA_LIMIT = 10; // Default quota limit

export interface QuotaInfo {
    used: number;
    limit: number;
    remaining: number;
}

export async function checkAndUpdateQuota(request: NextRequest): Promise<NextResponse | { quotaInfo: QuotaInfo } | null> {
    try {
        // Get the current user
        const currentUser = auth.currentUser;
        console.log('Current user in quota middleware:', currentUser?.uid);

        if (!currentUser) {
            console.log('No user found in middleware');
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        const userId = currentUser.uid;
        const userDoc = doc(db, `users/${userId}`);
        const userSnapshot = await getDoc(userDoc);

        if (!userSnapshot.exists()) {
            // If user document doesn't exist, create it with initial quota
            const today = new Date().toISOString().slice(0, 10);
            console.log(`Creating new user doc with quota for user ${userId}`);
            await setDoc(userDoc, {
                dailyQuota: {
                    date: today,
                    used: 1
                }
            }, { merge: true });

            // Return quota info
            const quotaInfo: QuotaInfo = {
                used: 1,
                limit: QUOTA_LIMIT,
                remaining: QUOTA_LIMIT - 1
            };
            console.log('Initializing quota for new user:', quotaInfo);
            return { quotaInfo }; // Return quota info, no error
        }

        const userData = userSnapshot.data();
        const quota = userData.dailyQuota || { date: '', used: 0 };
        const today = new Date().toISOString().slice(0, 10);
        console.log('User current quota:', quota, 'Today is:', today);

        // Reset quota if it's a new day
        if (quota.date !== today) {
            console.log(`Resetting quota for user ${userId} - new day`);
            await updateDoc(userDoc, {
                dailyQuota: {
                    date: today,
                    used: 1
                }
            });

            // Return quota info
            const quotaInfo: QuotaInfo = {
                used: 1,
                limit: QUOTA_LIMIT,
                remaining: QUOTA_LIMIT - 1
            };
            console.log('Reset quota for new day:', quotaInfo);
            return { quotaInfo }; // Return quota info, no error
        }

        // Check if quota exceeded
        if (quota.used >= QUOTA_LIMIT) {
            console.log(`Quota exceeded for user ${userId}: ${quota.used}/${QUOTA_LIMIT}`);
            // Return error response with quota information
            return NextResponse.json(
                {
                    error: 'Daily quota exceeded',
                    quota: {
                        used: quota.used,
                        limit: QUOTA_LIMIT,
                        remaining: 0
                    }
                },
                { status: 429 }
            );
        }

        // Increment quota
        const newUsed = quota.used + 1;
        console.log(`Incrementing quota for user ${userId} from ${quota.used} to ${newUsed}`);
        await updateDoc(userDoc, {
            'dailyQuota.used': newUsed
        });

        // Return quota info
        const quotaInfo: QuotaInfo = {
            used: newUsed,
            limit: QUOTA_LIMIT,
            remaining: QUOTA_LIMIT - newUsed
        };
        console.log('Updated quota:', quotaInfo);
        return { quotaInfo }; // Return quota info, no error
    } catch (error) {
        console.error('Error checking quota:', error);
        return NextResponse.json(
            { error: 'Failed to check quota' },
            { status: 500 }
        );
    }
} 