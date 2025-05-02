import { NextResponse } from 'next/server';
import { db } from '@/app/firebase/firebase';
import { doc, getDoc, setDoc, updateDoc, increment as firestoreIncrement } from 'firebase/firestore';

// Set the constant for the new quota limit
const QUOTA_LIMIT = 10; // Default quota limit

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, feature } = body;

        if (!userId) {
            console.error('Increment quota request missing userId parameter');
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Reference to user's quota document
        const userQuotaRef = doc(db, 'quotas', userId);
        const quotaSnapshot = await getDoc(userQuotaRef);

        // Get today's date in consistent YYYY-MM-DD format (UTC)
        const today = new Date().toISOString().split('T')[0];

        if (!quotaSnapshot.exists()) {
            console.log(`Creating new quota document for user: ${userId} with limit: ${QUOTA_LIMIT}`);
            // Create new quota document if it doesn't exist
            await setDoc(userQuotaRef, {
                count: 1,
                limit: QUOTA_LIMIT, // Default daily limit
                lastResetDate: today,
                featureUsage: {
                    [feature || 'unspecified']: 1
                }
            });

            return NextResponse.json({
                success: true,
                count: 1,
                limit: QUOTA_LIMIT,
                remaining: QUOTA_LIMIT - 1,
                exceeded: false
            });
        }

        const quotaData = quotaSnapshot.data();

        // Check if user has old limit and needs upgrading
        const userLimit = quotaData.limit;
        let limitNeedsUpdate = false;

        // If the user's limit is 5 or not set (null/undefined), it needs to be updated to 10
        if (userLimit === 5 || userLimit == null) {
            limitNeedsUpdate = true;
            console.log(`Found user ${userId} with old limit ${userLimit}, will update to ${QUOTA_LIMIT} during increment`);
        }

        // Check if we need to reset quota (new day)
        if (quotaData.lastResetDate !== today) {
            console.log(`Resetting quota for user: ${userId} - new day`);

            const updateData: any = {
                count: 1, // Start with 1 for this request
                lastResetDate: today,
                // Initialize or update feature tracking
                featureUsage: {
                    [feature || 'unspecified']: 1
                }
            };

            // Always use the new limit on reset
            updateData.limit = QUOTA_LIMIT;

            // If this was also an upgrade, track it
            if (limitNeedsUpdate) {
                updateData._migrated = {
                    from: userLimit || 'unset',
                    to: QUOTA_LIMIT,
                    timestamp: new Date().toISOString()
                };
            }

            await updateDoc(userQuotaRef, updateData);

            return NextResponse.json({
                success: true,
                count: 1,
                limit: QUOTA_LIMIT,
                remaining: QUOTA_LIMIT - 1,
                exceeded: false,
                wasReset: true,
                wasUpgraded: limitNeedsUpdate
            });
        }

        // Current quota exists and is for today
        // Make sure we're using the correct limit (migrated or not)
        const effectiveLimit = limitNeedsUpdate ? QUOTA_LIMIT : (quotaData.limit || QUOTA_LIMIT);
        const newCount = (quotaData.count || 0) + 1;
        const exceeded = newCount > effectiveLimit;

        if (exceeded) {
            console.log(`Quota exceeded for user: ${userId} - count: ${newCount}, limit: ${effectiveLimit}`);
            return NextResponse.json({
                success: false,
                count: quotaData.count,
                limit: effectiveLimit,
                remaining: 0,
                exceeded: true,
                message: 'Daily quota exceeded'
            });
        }

        // Update the quota with new count and track feature usage
        const updateData: any = {
            count: firestoreIncrement(1),
        };

        // If we need to update the limit, do it now
        if (limitNeedsUpdate) {
            updateData.limit = QUOTA_LIMIT;
            updateData._migrated = {
                from: userLimit || 'unset',
                to: QUOTA_LIMIT,
                timestamp: new Date().toISOString()
            };
            console.log(`Upgrading limit for user: ${userId} during increment operation`);
        }

        // Update or initialize feature tracking
        if (feature) {
            updateData[`featureUsage.${feature}`] = firestoreIncrement(1);
        }

        await updateDoc(userQuotaRef, updateData);
        console.log(`Incremented quota for user: ${userId} - new count: ${newCount}, limit: ${effectiveLimit}`);

        return NextResponse.json({
            success: true,
            count: newCount,
            limit: effectiveLimit,
            remaining: Math.max(0, effectiveLimit - newCount),
            exceeded: false,
            wasUpgraded: limitNeedsUpdate
        });

    } catch (error) {
        console.error('Error incrementing quota:', error);
        return NextResponse.json(
            { error: 'Failed to increment quota' },
            { status: 500 }
        );
    }
} 