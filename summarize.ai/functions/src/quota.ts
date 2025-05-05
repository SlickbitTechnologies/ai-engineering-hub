import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firestore if admin is not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const firestore = admin.firestore();

/**
 * Cloud Function that resets all users' daily quotas at midnight local time (Asia/Kolkata)
 */
export const resetDailyQuotas = functions.pubsub
    .schedule('0 0 * * *') // midnight
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        const today = new Date().toISOString().slice(0, 10);
        const batchSize = 500; // Firestore limit

        try {
            // Get all user documents
            const usersSnapshot = await firestore.collection('users').get();

            // Process in batches (Firestore has a limit of 500 writes per batch)
            const promises: Promise<admin.firestore.WriteResult[]>[] = [];
            let currentBatch = firestore.batch();
            let operationCount = 0;

            usersSnapshot.forEach((userDoc: admin.firestore.QueryDocumentSnapshot) => {
                currentBatch.update(userDoc.ref, {
                    'dailyQuota.used': 0,
                    'dailyQuota.date': today
                });

                operationCount++;

                // If we reached the batch limit, commit and start a new batch
                if (operationCount >= batchSize) {
                    promises.push(currentBatch.commit());
                    currentBatch = firestore.batch();
                    operationCount = 0;
                }
            });

            // Commit any remaining operations
            if (operationCount > 0) {
                promises.push(currentBatch.commit());
            }

            // Wait for all batches to complete
            await Promise.all(promises);

            functions.logger.info(`Successfully reset quotas for ${usersSnapshot.size} users on ${today}`);
            return null;
        } catch (error) {
            functions.logger.error('Error resetting quotas:', error);
            return null;
        }
    }); 