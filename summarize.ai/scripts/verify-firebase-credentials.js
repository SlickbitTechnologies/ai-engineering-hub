/**
 * Script to verify Firebase Admin credentials
 * Used to validate environment variables are correctly set up
 */
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// For logging purposes only
console.log('=== Firebase Admin Environment Check ===');
console.log('FIREBASE_PROJECT_ID present:', !!process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL present:', !!process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY present:', !!process.env.FIREBASE_PRIVATE_KEY);

// Only initialize if all required env vars are present
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error('Error: Missing required Firebase Admin environment variables');
  process.exit(1);
}

// Log key info for debugging without exposing secrets
console.log('Firebase Admin initialization - Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Firebase Admin initialization - Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('Firebase Admin initialization - Private Key formatting:');
console.log('- Private key starts with:', process.env.FIREBASE_PRIVATE_KEY.substring(0, 15) + '...');
console.log('- Private key contains newlines:', process.env.FIREBASE_PRIVATE_KEY.includes('\n'));
console.log('- Private key length:', process.env.FIREBASE_PRIVATE_KEY.length);

try {
  // Try to initialize Firebase Admin SDK
  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  }, 'verify-credentials');

  // Test connection by getting a list of users (limited to 1)
  admin.auth(app).listUsers(1)
    .then(() => {
      console.log('Firebase Admin initialized successfully');
      
      // Clean up and exit
      app.delete().then(() => {
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('Error verifying Firebase Admin connection:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
} 