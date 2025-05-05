/**
 * One-time migration script to update all users' quota limits from 5 to 10
 * 
 * Run this script once to update all existing users in the database.
 * 
 * Usage:
 * 1. Ensure you're in the project root directory
 * 2. Run: npx ts-node --project tsconfig.json app/scripts/migrate-quota-limits.ts
 */

import { db } from '../firebase/firebase';
import { collection, getDocs, updateDoc, doc, writeBatch, query, where, limit } from 'firebase/firestore';

const OLD_LIMIT = 5;
const NEW_LIMIT = 10;
const BATCH_SIZE = 500; // Firestore has a limit of 500 operations per batch

async function migrateQuotaLimits() {
    console.log('Starting quota limit migration...');
    console.log(`Updating all users with limit=${OLD_LIMIT} to limit=${NEW_LIMIT}`);

    try {
        const quotasRef = collection(db, 'quotas');

        // First query to get users with the old limit specifically
        const oldLimitQuery = query(quotasRef, where('limit', '==', OLD_LIMIT));
        const oldLimitSnapshot = await getDocs(oldLimitQuery);

        // Second query to get users with no limit set (will use default)
        const noLimitQuery = query(quotasRef, where('limit', '==', null));
        const noLimitSnapshot = await getDocs(noLimitQuery);

        // Combine the documents that need updating
        const documents = [...oldLimitSnapshot.docs, ...noLimitSnapshot.docs];

        if (documents.length === 0) {
            console.log('No users found with the old limit. Nothing to update.');
            return;
        }

        console.log(`Found ${documents.length} users to update.`);

        // Update in batches to avoid Firestore limits
        let totalUpdated = 0;
        let currentBatch = writeBatch(db);
        let operationsInBatch = 0;

        for (const document of documents) {
            const docRef = doc(db, 'quotas', document.id);
            currentBatch.update(docRef, {
                limit: NEW_LIMIT,
                // Add a flag to track which documents were migrated
                _migrated: {
                    from: OLD_LIMIT,
                    to: NEW_LIMIT,
                    timestamp: new Date().toISOString()
                }
            });

            operationsInBatch++;

            // If we've reached the batch limit, commit and create a new batch
            if (operationsInBatch >= BATCH_SIZE) {
                await currentBatch.commit();
                totalUpdated += operationsInBatch;
                console.log(`Committed batch, updated ${totalUpdated} users so far.`);

                // Reset for next batch
                currentBatch = writeBatch(db);
                operationsInBatch = 0;
            }
        }

        // Commit any remaining updates
        if (operationsInBatch > 0) {
            await currentBatch.commit();
            totalUpdated += operationsInBatch;
        }

        console.log(`✅ Successfully updated ${totalUpdated} user quota limits from ${OLD_LIMIT} to ${NEW_LIMIT}.`);

    } catch (error) {
        console.error('❌ Error updating quota limits:', error);
        throw error;
    }
}

// Self-invoking async function to run the migration
(async () => {
    try {
        await migrateQuotaLimits();
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
})(); 