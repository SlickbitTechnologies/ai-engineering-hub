import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

let authInstance;

try {
    // Initialize Firebase Admin if not already initialized
    if (!getApps().length) {
        console.log('Initializing Firebase Admin...');

        // Debug environment variables
        console.log('Environment mode:', process.env.NODE_ENV);
        console.log('Firebase Admin environment variables:');
        console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || 'not set');
        console.log('- FIREBASE_CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
        console.log('- FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);

        // Make sure the client email has the proper format
        let clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
        // Add the project ID to the email if it's not already there
        if (clientEmail && !clientEmail.includes('@')) {
            clientEmail = `${clientEmail}@${process.env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`;
            console.log('Reformatted client email to:', clientEmail);
        }

        // Check for required environment variables
        if (!process.env.FIREBASE_PROJECT_ID) {
            console.error('FIREBASE_PROJECT_ID environment variable is missing');
        }
        if (!clientEmail) {
            console.error('FIREBASE_CLIENT_EMAIL environment variable is missing');
        }
        if (!process.env.FIREBASE_PRIVATE_KEY) {
            console.error('FIREBASE_PRIVATE_KEY environment variable is missing');
        }

        // Clean up private key if needed
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
        if (privateKey) {
            // Replace \\n with real newlines
            privateKey = privateKey.replace(/\\n/g, '\n');

            // Check if private key has correct format
            if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                console.warn('FIREBASE_PRIVATE_KEY may have incorrect format');
            }
        }

        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: clientEmail,
            privateKey: privateKey
        };

        console.log('Firebase service account config:', {
            projectId: serviceAccount.projectId,
            clientEmail: serviceAccount.clientEmail ?
                serviceAccount.clientEmail.substring(0, 5) + '...' : undefined,
            privateKeyProvided: !!serviceAccount.privateKey,
            privateKeyLength: serviceAccount.privateKey?.length || 0
        });

        // Attempt to initialize the app
        try {
            initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('Firebase Admin initialized successfully');
        } catch (initError) {
            console.error('Failed to initialize Firebase Admin app:', initError);
            throw initError;
        }
    } else {
        console.log('Firebase Admin already initialized');
    }

    // Initialize Auth
    try {
        authInstance = getAuth();
        console.log('Firebase Auth initialized successfully');
    } catch (authError) {
        console.error('Failed to initialize Firebase Auth:', authError);
        throw authError;
    }
} catch (error) {
    console.error('Fatal error in Firebase initialization:', error);

    // In development mode, create a mock auth for testing
    if (process.env.NODE_ENV === 'development') {
        console.warn('DEVELOPMENT MODE: Creating mock auth implementation');
        authInstance = {
            verifyIdToken: async (token: string) => {
                console.log('Development mode verifyIdToken called with token:', token?.substring(0, 10) + '...');

                try {
                    // Try to decode the token to get user information - using Buffer in Node.js environment
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                        console.log('Token payload:', payload);
                        return {
                            uid: payload.user_id || payload.sub || payload.uid || 'dev-user-123',
                            email: payload.email || 'dev@example.com'
                        };
                    }
                } catch (e) {
                    console.error('Error decoding token:', e);
                }

                // Return a mock token with uid for development
                return { uid: 'dev-user-123' };
            }
        };
    } else {
        throw error;
    }
}

// Export the auth instance for server-side operations
export const auth = authInstance; 