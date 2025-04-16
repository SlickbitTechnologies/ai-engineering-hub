import * as admin from 'firebase-admin';
import { firebaseAdminConfig } from './firebase-admin-config';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
    try {
        // Initialize with credentials from environment variables
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            admin.initializeApp({
                credential: admin.credential.cert(firebaseAdminConfig as admin.ServiceAccount),
            });
            console.log('Firebase Admin initialized with environment variables');
        } else {
            // Fall back to using application default credentials
            // This will work in production environments like Vercel
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
            console.log('Firebase Admin initialized with application default credentials');
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);

        // Initialize with a fallback for development if regular initialization fails
        if (process.env.NODE_ENV === 'development') {
            console.warn('Initializing Firebase Admin with development fallback');
            // Using an empty object as a placeholder for credential in development
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID || 'dev-project',
            });
        }
    }
}

export const firebaseAdmin = admin; 