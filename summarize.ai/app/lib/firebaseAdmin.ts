import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Enhanced logging for environment variables
console.log("=== Firebase Admin Environment Check ===");
console.log("FIREBASE_PROJECT_ID present:", !!process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL present:", !!process.env.FIREBASE_CLIENT_EMAIL);
console.log("FIREBASE_PRIVATE_KEY present:", !!process.env.FIREBASE_PRIVATE_KEY);

// Check if required environment variables are set
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error(`Firebase Admin initialization error: Missing environment variables: ${missingEnvVars.join(', ')}`);
    throw new Error(`Firebase Admin initialization error: Missing environment variables: ${missingEnvVars.join(', ')}`);
}

// Initialize Firebase Admin SDK if it hasn't been initialized yet
if (!getApps().length) {
    try {
        // Properly format the private key, handling different formats
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

        // If key is enclosed in quotes, remove them first
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }

        // Replace escaped newlines with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');

        console.log("Firebase Admin initialization - Project ID:", process.env.FIREBASE_PROJECT_ID);
        console.log("Firebase Admin initialization - Client Email:", process.env.FIREBASE_CLIENT_EMAIL);
        console.log("Firebase Admin initialization - Private Key formatting:");
        console.log("- Private key starts with:", privateKey.substring(0, 15) + "...");
        console.log("- Private key contains newlines:", privateKey.includes("\n"));
        console.log("- Private key length:", privateKey.length);

        if (!privateKey.includes('BEGIN PRIVATE KEY')) {
            console.error('Private key appears to be malformed - missing BEGIN PRIVATE KEY');
            throw new Error('Firebase private key is malformed');
        }

        const serviceAccount: ServiceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
        };

        initializeApp({
            credential: cert(serviceAccount),
        });
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
        // More detailed error information
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw error; // Re-throw to prevent silent failures
    }
}

/**
 * Verifies a Firebase ID token and returns the decoded token
 * @param token The Firebase ID token to verify
 * @returns The decoded token or null if verification fails
 */
export async function verifyIdToken(token: string) {
    if (!token || token === 'undefined') {
        console.error('Invalid token received: Token is empty or undefined');
        return null;
    }

    // Log token format for debugging (without exposing full token)
    console.log('Token format check:');
    console.log('- Token length:', token.length);
    console.log('- First 10 chars:', token.substring(0, 10) + '...');

    try {
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(token);
        console.log('Token verified successfully for user:', decodedToken.uid);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying auth token:', error);
        // More detailed error information
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        // Add this to check if we're getting Auth/App errors
        if (error instanceof Error && error.message.includes('app/no-app')) {
            console.error('Firebase Admin app is not properly initialized');
        }
        return null;
    }
}

export { admin }; 