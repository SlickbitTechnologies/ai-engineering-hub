// Script to verify Firebase Admin credentials
require('dotenv').config({ path: '.env.local' });

console.log('==== Firebase Admin Credentials Check ====');

// Check for required variables
const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
let missingVars = false;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  console.log(`${varName} exists: ${exists}`);
  
  if (!exists) {
    missingVars = true;
  } else if (varName === 'FIREBASE_PRIVATE_KEY') {
    // Check private key format
    console.log(`Private key starts with: ${value.substring(0, 25)}...`);
    console.log(`Private key contains quotes: ${value.includes('"')}`);
    console.log(`Private key contains escaped newlines: ${value.includes('\\n')}`);
    console.log(`Private key contains actual newlines: ${value.includes('\n')}`);
    console.log(`Private key length: ${value.length}`);
  }
});

if (missingVars) {
  console.error('ERROR: Missing required Firebase Admin environment variables!');
  process.exit(1);
}

// Try to initialize Firebase Admin
try {
  const admin = require('firebase-admin');
  
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    })
  });
  
  console.log('Firebase Admin initialization: SUCCESS');
  console.log(`Initialized with project: ${process.env.FIREBASE_PROJECT_ID}`);
  
  // Clean up
  admin.app().delete().then(() => {
    console.log('Test app deleted successfully');
    process.exit(0);
  });
  
} catch (error) {
  console.error('Firebase Admin initialization ERROR:');
  console.error(error);
  process.exit(1);
} 