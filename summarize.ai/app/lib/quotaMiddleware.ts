import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/firebase/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { verifyIdToken } from '@/app/lib/firebaseAdmin';

const QUOTA_LIMIT = 10; // Default quota limit

export interface QuotaInfo {
    used: number;
    limit: number;
    remaining: number;
}

// Add a function to check projects match
function checkProjectsMatch() {
    const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const serverProjectId = process.env.FIREBASE_PROJECT_ID;

    if (clientProjectId !== serverProjectId) {
        console.error(`Project ID mismatch: client (${clientProjectId}) vs server (${serverProjectId})`);
        return false;
    }

    return true;
}

export async function checkAndUpdateQuota(request: NextRequest): Promise<NextResponse | { quotaInfo: QuotaInfo } | null> {
    try {
        console.log('=== Quota Middleware Starting ===');

        // First check that client and server Firebase projects match
        if (!checkProjectsMatch()) {
            return NextResponse.json(
                { error: 'Configuration error', message: 'Firebase project mismatch between client and server' },
                { status: 500 }
            );
        }

        // Get the Authorization header
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            console.log('Authentication failed: No authorization header found at all');
            return NextResponse.json(
                { error: 'User not authenticated', message: 'No authorization header found' },
                { status: 401 }
            );
        }

        if (!authHeader.startsWith('Bearer ')) {
            console.log('Authentication failed: Authorization header does not start with Bearer');
            console.log('Authorization header format:', authHeader.substring(0, 15) + '...');
            return NextResponse.json(
                { error: 'User not authenticated', message: 'Invalid authorization header format' },
                { status: 401 }
            );
        }

        // Extract and verify the token
        const token = authHeader.split('Bearer ')[1];

        if (!token) {
            console.log('Authentication failed: Token is null after splitting');
            return NextResponse.json(
                { error: 'Invalid authentication token', message: 'Token is null after parsing header' },
                { status: 401 }
            );
        }

        if (token === 'undefined' || token === 'null') {
            console.log('Authentication failed: Token is literal string "undefined" or "null"');
            return NextResponse.json(
                { error: 'Invalid authentication token', message: 'Token has invalid value' },
                { status: 401 }
            );
        }

        // Log token for debugging (only first few characters)
        console.log('Token received - length:', token.length);
        console.log('Token received (first/last 10 chars):',
            token.substring(0, 10) + '...' + token.substring(token.length - 10));

        console.log('Calling verifyIdToken...');
        const decodedToken = await verifyIdToken(token);

        if (!decodedToken) {
            console.log('Authentication failed: Token verification returned null');
            return NextResponse.json(
                { error: 'Invalid authentication token', message: 'Token verification failed' },
                { status: 401 }
            );
        }

        const userId = decodedToken.uid;
        console.log('Authentication successful - User ID:', userId);

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
        console.error('Error in quota middleware:', error);

        // Enhanced error logging
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }

        return NextResponse.json(
            {
                error: 'Failed to check quota',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}