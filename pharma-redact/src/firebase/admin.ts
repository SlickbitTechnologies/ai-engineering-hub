import * as admin from 'firebase-admin';

// Check if Firebase Admin SDK is already initialized
if (!admin.apps.length) {
    try {
        // Log environment variables for debugging
        console.log('Firebase Admin initialization with explicit project credentials');

        // Create service account with explicit project credentials
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        };

        // Initialize with explicit credentials
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('Firebase Admin SDK initialized successfully with explicit project credentials');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);

        // Development fallback
        if (process.env.NODE_ENV === 'development') {
            console.warn('Using development mode authentication fallback');
        } else {
            throw error;
        }
    }
}

// Create a mock verifyIdToken function for development mode
const verifyIdTokenDev = async (token: string, req?: any) => {
    console.log('Development mode token verification');

    try {
        // First check if we have a user ID in the request headers (from client-side localStorage)
        if (req?.headers && req.headers['x-user-id']) {
            const userId = req.headers['x-user-id'];
            console.log(`Development mode using user ID from request header: ${userId}`);
            return {
                uid: userId,
                email: `${userId}@example.com`
            };
        }

        // Extract token data for development
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            console.log('Development token payload:', {
                uid: payload.user_id || payload.sub || payload.uid,
                email: payload.email
            });

            return {
                uid: payload.user_id || payload.sub || payload.uid || 'dev-user-123',
                email: payload.email || 'dev@example.com'
            };
        }
    } catch (e) {
        console.error('Error decoding token in development mode:', e);
    }

    return { uid: 'dev-user-123' };
};

// Export admin and auth with development fallbacks
export const firebaseAdmin = admin;

// Define a minimal decoded token interface for our needs
interface MinimalDecodedToken {
    uid: string;
    email?: string;
    [key: string]: any; // Allow any other properties
}

// Define a custom auth interface that can handle the request parameter
interface AuthInterface {
    verifyIdToken(token: string, request?: any): Promise<MinimalDecodedToken>;
}

// Create the auth object with the proper interface
export const auth: AuthInterface = {
    verifyIdToken: process.env.NODE_ENV === 'development'
        ? verifyIdTokenDev
        : (token: string) => admin.auth().verifyIdToken(token)
};

export default admin; 