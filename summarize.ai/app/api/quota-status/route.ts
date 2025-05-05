import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { verifyIdToken } from '@/app/lib/firebaseAdmin';

// Set the constant for the new quota limit
const QUOTA_LIMIT = 10; // Default quota limit

export async function GET(request: NextRequest) {
    try {
        // Get the Authorization header
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Authentication failed: No valid authorization header found');
            return NextResponse.json(
                { error: 'User not authenticated', message: 'No valid authorization header found' },
                { status: 401 }
            );
        }

        // Extract and verify the token
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);

        if (!decodedToken) {
            console.log('Authentication failed: Token verification failed');
            return NextResponse.json(
                { error: 'Invalid authentication token', message: 'Token could not be verified' },
                { status: 401 }
            );
        }

        const userId = decodedToken.uid;
        console.log('Getting quota status for authenticated user:', userId);

        // Reference to the user's quota document
        const userQuotaRef = doc(db, 'quotas', userId);
        const userQuotaSnap = await getDoc(userQuotaRef);

        if (!userQuotaSnap.exists()) {
            console.log(`Creating new quota document for user: ${userId} with limit: ${QUOTA_LIMIT}`);
            // If no quota document exists, create initial quota state
            return NextResponse.json({
                count: 0,
                limit: QUOTA_LIMIT,
                lastResetDate: new Date().toISOString().split('T')[0], // Store as YYYY-MM-DD
                status: 'active'
            });
        }

        const userData = userQuotaSnap.data();
        const today = new Date().toISOString().split('T')[0]; // UTC date as YYYY-MM-DD

        // Check if user has old limit and needs upgrading
        const userLimit = userData.limit;
        let limitNeedsUpdate = false;

        // If the user's limit is 5 or not set (null/undefined), it needs to be updated to 10
        if (userLimit === 5 || userLimit == null) {
            limitNeedsUpdate = true;
            console.log(`Found user ${userId} with old limit ${userLimit}, will update to ${QUOTA_LIMIT}`);
        }

        // Check if we need to reset the quota (new day) or update the limit
        if (userData.lastResetDate !== today || limitNeedsUpdate) {
            // Prepare the update data
            const updatedData: any = {
                count: userData.lastResetDate !== today ? 0 : userData.count || 0, // Reset count only if it's a new day
                lastResetDate: today,
            };

            // Always ensure limit is set to the new value if it needs updating
            if (limitNeedsUpdate) {
                updatedData.limit = QUOTA_LIMIT;
                // Add a migration flag for tracking
                updatedData._migrated = {
                    from: userLimit || 'unset',
                    to: QUOTA_LIMIT,
                    timestamp: new Date().toISOString()
                };
            } else {
                // Preserve user's existing limit if it doesn't need updating
                updatedData.limit = userData.limit;
            }

            // Update in Firestore
            await updateDoc(userQuotaRef, updatedData);
            console.log(`Updated user ${userId} with new data:`, updatedData);

            // Return the updated status
            const response = {
                ...updatedData,
                status: updatedData.count >= updatedData.limit ? 'exceeded' : 'active',
                wasReset: userData.lastResetDate !== today,
                wasUpgraded: limitNeedsUpdate
            };

            return NextResponse.json(response);
        }

        // Return current quota status, ensuring limit is at least QUOTA_LIMIT
        const effectiveLimit = Math.max(userData.limit || 0, QUOTA_LIMIT);
        const response = {
            count: userData.count || 0,
            limit: effectiveLimit,
            lastResetDate: userData.lastResetDate,
            status: userData.count >= effectiveLimit ? 'exceeded' : 'active',
            wasReset: false,
            wasUpgraded: false
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error checking quota status:', error);
        return NextResponse.json({ error: 'Failed to check quota status' }, { status: 500 });
    }
} 