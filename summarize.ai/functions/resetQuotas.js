/**
 * Cloud Function to reset user quotas daily
 * Deploy this when upgrading to Firebase Blaze Plan
 * 
 * To configure with Cloud Scheduler:
 * 1. Deploy this function:
 *    firebase deploy --only functions:resetDailyQuotas
 * 
 * 2. Set up a Cloud Scheduler job (in Google Cloud Console):
 *    - Frequency: 0 0 * * * (runs at midnight UTC daily)
 *    - Target: HTTP
 *    - URL: https://[REGION]-[PROJECT_ID].cloudfunctions.net/resetDailyQuotas
 *    - Auth header: Add appropriate authentication
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function that resets all user quotas daily
 * Triggered by Cloud Scheduler via HTTP request
 */
exports.resetDailyQuotas = functions.https.onRequest(async (req, res) => {
  try {
    // Only allow POST requests for security
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Get all quota documents
    const quotaSnapshot = await db.collection('quotas').get();
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Batch operations for efficiency
    const batchSize = 500; // Firestore batch limit
    let batch = db.batch();
    let operationCount = 0;
    let totalResetCount = 0;
    
    console.log(`Starting daily quota reset for ${quotaSnapshot.size} users`);
    
    // Process each user's quota
    quotaSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Only reset if the last reset date is not today
      if (userData.lastResetDate !== today) {
        batch.update(doc.ref, {
          count: 0,
          lastResetDate: today
        });
        
        operationCount++;
        totalResetCount++;
        
        // If we've reached the batch limit, commit and start a new batch
        if (operationCount >= batchSize) {
          batch.commit();
          batch = db.batch();
          operationCount = 0;
          console.log(`Committed batch of ${batchSize} quota resets`);
        }
      }
    });
    
    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} quota resets`);
    }
    
    console.log(`Successfully reset quotas for ${totalResetCount} users`);
    
    res.status(200).json({
      success: true,
      message: `Reset ${totalResetCount} user quotas`,
      date: today
    });
  } catch (error) {
    console.error('Error resetting quotas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}); 