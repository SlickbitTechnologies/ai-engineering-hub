/**
 * Script to prepare the project for Vercel deployment
 * This runs all the necessary optimization steps before deployment
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('==== Preparing Summarize.AI for Vercel Deployment ====');

try {
  // Run the fix-use-client.js script
  console.log('\n1. Running use client directive fix...');
  execSync('node scripts/fix-use-client.js', { stdio: 'inherit' });
  
  // Run the optimize-for-vercel.js script
  console.log('\n2. Running Vercel build optimizations...');
  execSync('node scripts/optimize-for-vercel.js', { stdio: 'inherit' });
  
  // Verify Firebase credentials
  console.log('\n3. Verifying Firebase credentials...');
  execSync('npm run verify-firebase', { stdio: 'inherit' });
  
  // Run a clean build
  console.log('\n4. Running clean build...');
  execSync('rimraf .next && npm run build', { stdio: 'inherit' });
  
  console.log('\n==== Deployment Preparation Complete ====');
  console.log('\nThe project is now ready to be deployed to Vercel.');
  console.log('Remember to configure the following environment variables in Vercel:');
  console.log('- NEXT_PUBLIC_FIREBASE_API_KEY');
  console.log('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.log('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  console.log('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  console.log('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  console.log('- NEXT_PUBLIC_FIREBASE_APP_ID');
  console.log('- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID');
  console.log('- FIREBASE_PROJECT_ID');
  console.log('- FIREBASE_CLIENT_EMAIL');
  console.log('- FIREBASE_PRIVATE_KEY');
  
  console.log('\nFor detailed deployment instructions, see VERCEL_DEPLOYMENT.md');
} catch (error) {
  console.error('Error during deployment preparation:', error);
  process.exit(1);
} 