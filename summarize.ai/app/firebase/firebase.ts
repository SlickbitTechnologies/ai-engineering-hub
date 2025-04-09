import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Storage will be initialized only on client side

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NEXT_PUBLIC_FIREBASE_API_KEY: string;
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
            NEXT_PUBLIC_FIREBASE_APP_ID: string;
            NEXT_PUBLIC_GEMINI_API_KEY: string;
        }
    }
}

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Define a dummy storage to avoid breaking code
let storage: any = null;

// Only initialize storage on the client side
if (typeof window !== 'undefined') {
    // Dynamic import for storage module to avoid SSR issues
    import('firebase/storage')
        .then(({ getStorage }) => {
            storage = getStorage(app);
        })
        .catch(error => {
            console.warn('Firebase storage module could not be loaded in browser:', error);
        });
} else {
    console.log('Skipping Firebase storage initialization on server');
}

export { storage };
export default app; 