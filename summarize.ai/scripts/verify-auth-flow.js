/**
 * Script to verify the authentication flow between client and server
 * This helps diagnose issues with token-based authentication
 */
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  })
}, 'auth-flow-verification');

// Base URL for API endpoints
const BASE_URL = 'http://localhost:3000';

console.log('==== Authentication Flow Verification ====');

// Create a custom token for testing
async function runDiagnostics() {
  try {
    // Step 1: Create a test user or use an existing one
    const testEmail = 'test@example.com';
    let uid;

    try {
      // Try to create a test user
      const userRecord = await admin.auth().createUser({
        email: testEmail,
        password: 'testPassword123'
      });
      uid = userRecord.uid;
      console.log(`Created test user: ${uid}`);
    } catch (error) {
      // If user already exists, get their UID
      if (error.code === 'auth/email-already-exists') {
        const userRecord = await admin.auth().getUserByEmail(testEmail);
        uid = userRecord.uid;
        console.log(`Using existing test user: ${uid}`);
      } else {
        throw error;
      }
    }

    // Step 2: Create a custom token
    const customToken = await admin.auth().createCustomToken(uid);
    console.log(`Created custom token for user ${uid}`);

    // Step 3: Test API endpoints without token (should fail)
    console.log('\n--- Testing API endpoints without authentication ---');
    
    try {
      await axios.get(`${BASE_URL}/api/current-user`);
      console.log('❌ /api/current-user allowed unauthenticated request (should have failed)');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ /api/current-user correctly rejected unauthenticated request');
      } else {
        console.log(`❌ /api/current-user unexpected error: ${error.message}`);
      }
    }
    
    try {
      await axios.get(`${BASE_URL}/api/quota-status`);
      console.log('❌ /api/quota-status allowed unauthenticated request (should have failed)');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ /api/quota-status correctly rejected unauthenticated request');
      } else {
        console.log(`❌ /api/quota-status unexpected error: ${error.message}`);
      }
    }

    // Step 4: Test quota-status with userId parameter (backward compatibility)
    console.log('\n--- Testing backward compatibility with userId parameter ---');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/quota-status?userId=${uid}`);
      if (response.status === 200) {
        console.log('✅ /api/quota-status with userId parameter successful');
        console.log('Response:', response.data);
      } else {
        console.log(`❌ /api/quota-status with userId parameter failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ /api/quota-status with userId parameter error: ${error.message}`);
    }

    // Step 5: Get an ID token using Firebase client SDK (simulated here)
    console.log('\n--- This step would normally use the Firebase Client SDK to exchange the custom token for an ID token ---');
    console.log('--- Since we cannot use the client SDK in a Node.js script, you need to test this in the browser ---');
    
    console.log(`\nManual Testing Instructions:
1. In your app, sign in a user and open the browser console
2. Run: const token = await firebase.auth().currentUser.getIdToken()
3. Copy that token
4. Use it to test your API endpoints:
   fetch('/api/current-user', { 
     headers: { 'Authorization': 'Bearer ' + token } 
   }).then(r => r.json()).then(console.log)
   
   fetch('/api/quota-status', { 
     headers: { 'Authorization': 'Bearer ' + token } 
   }).then(r => r.json()).then(console.log)
`);

    // Clean up
    await admin.app().delete();
    console.log('Authentication flow verification completed');
    
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

runDiagnostics(); 