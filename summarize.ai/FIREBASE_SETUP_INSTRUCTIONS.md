# Firebase Authentication Setup Guide

## Problem: 401 Unauthorized Error
You are experiencing a 401 Unauthorized error with the message "Invalid authentication token" when making requests to the text summarization API endpoint.

## Root Cause
The issue is caused by missing or misconfigured Firebase Admin SDK credentials in your environment. Firebase Admin is used on the server-side to verify authentication tokens from the client.

## Solution
1. Create a `.env.local` file in the root directory of your project with the following variables:

```
# Firebase Client-side configuration (you may already have these)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK configuration (server-side) - THESE ARE MISSING
FIREBASE_PROJECT_ID=same_as_your_project_id_above
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_private_key_with_newlines\n-----END PRIVATE KEY-----\n"
```

## How to Get Firebase Admin Credentials

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service accounts
4. Click "Generate new private key"
5. Save the downloaded JSON file securely
6. Extract the `project_id`, `client_email`, and `private_key` from this JSON file
7. Add these values to your `.env.local` file

**Important Notes:**
- Make sure the `FIREBASE_PRIVATE_KEY` includes the quotes `"` as shown above to preserve newlines
- The `FIREBASE_PROJECT_ID` should match your client-side `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- After adding these values, restart your development server

## Verifying the Setup

You can add this temporary logging code to your `app/lib/firebaseAdmin.ts` file to verify the environment variables are being loaded correctly:

```typescript
console.log("Firebase Admin ENV Variables Present:");
console.log("FIREBASE_PROJECT_ID:", !!process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL:", !!process.env.FIREBASE_CLIENT_EMAIL);
console.log("FIREBASE_PRIVATE_KEY:", !!process.env.FIREBASE_PRIVATE_KEY);
```

## Security Reminder
- Never commit your `.env.local` file to version control
- Keep your Firebase private key secure
- Restrict API key usage in the Firebase Console 