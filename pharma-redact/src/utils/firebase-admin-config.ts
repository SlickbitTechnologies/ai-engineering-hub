/**
 * Firebase Admin SDK Configuration
 * This file loads the Firebase admin configuration from environment variables
 */

export const firebaseAdminConfig = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: "c25ea0e1ae3e5a3877d619897a16a3897f6fd396",
    private_key: process.env.FIREBASE_PRIVATE_KEY,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: "106757720952926217692",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40pharma-redact.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
};

// For development debugging
if (process.env.NODE_ENV === 'development') {
    console.log('Firebase Admin config loaded with project:', process.env.FIREBASE_PROJECT_ID);
    console.log('Firebase Admin client email exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log('Firebase Admin private key exists:', !!process.env.FIREBASE_PRIVATE_KEY);
} 