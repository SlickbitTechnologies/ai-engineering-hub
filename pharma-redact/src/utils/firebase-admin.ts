import * as admin from 'firebase-admin';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
    try {
        // Initialize with credentials or environment variables
        // For development, we can use a service account credential JSON
        if (process.env.FIREBASE_ADMIN_CREDENTIAL) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else {
            // Fall back to using application default credentials
            // This will work in production environments like Vercel
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        }

        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);

        // Initialize with a fallback for development if regular initialization fails
        if (process.env.NODE_ENV === 'development') {
            console.warn('Initializing Firebase Admin with development fallback');
            // Using an empty object as a placeholder for credential in development
            admin.initializeApp({
                projectId: 'dev-project',
            });
        }
    }
}

export const firebaseAdmin = admin; 