# Vercel Deployment Guide for Summarize.AI

This guide provides instructions for deploying the Summarize.AI application to Vercel.

## Prerequisites

1. A Vercel account
2. Firebase project with necessary services enabled:
   - Authentication
   - Firestore Database
   - Firebase Admin SDK

## Setup Environment Variables

You'll need to set up the following environment variables in your Vercel project settings:

### Firebase Client Variables (for frontend)
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Your Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Your Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Your Firebase measurement ID

### Firebase Admin Variables (for backend/API)
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Your Firebase client email (from service account)
- `FIREBASE_PRIVATE_KEY` - Your Firebase private key (from service account)

## Important Notes for Deployment

1. **Private Key Format**: When adding your Firebase Admin private key to Vercel, make sure to include all line breaks. In the Vercel UI, you can paste the key as-is, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts.

2. **Build Configuration**: The included `vercel.json` file contains basic configuration for deployment. You shouldn't need to modify it unless you have specific requirements.

3. **API Routes**: This application uses dynamic API routes that require server-side execution. The configuration has been set up to handle this correctly.

4. **Static Generation Issues**: If you encounter errors related to static generation during deployment, these should be automatically handled by the provided configuration which disables static optimization for routes that need server-side data.

## Deployment Steps

1. Connect your GitHub repository to Vercel
2. Configure the environment variables as described above
3. Deploy the application
4. After deployment, verify that API endpoints are working correctly

## Troubleshooting

If you encounter issues with Firebase Admin authentication after deployment:

1. Check that all environment variables are correctly set
2. Verify that your Firebase service account has the correct permissions
3. Make sure the private key format is preserved correctly (including line breaks)
4. Check Vercel logs for specific error messages

## Local Testing

Before deploying, you can test the production build locally:

```bash
npm run build
npm start
```

This will create a production build and serve it locally, allowing you to verify that everything works as expected before deploying to Vercel. 