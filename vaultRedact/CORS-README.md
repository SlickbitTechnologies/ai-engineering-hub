# Firebase Storage CORS Configuration

This document explains how to set up Cross-Origin Resource Sharing (CORS) for your Firebase Storage bucket.

## Why CORS Configuration is Needed

CORS is necessary for web applications to securely access resources from different domains. In the case of Pharma-Redact, we need this configuration to:

1. Allow the web application to download files directly from Firebase Storage
2. Enable the redaction engine to process and upload redacted documents
3. Prevent unauthorized access while allowing legitimate requests

## Instructions for Setting Up CORS

### Prerequisites

- Google Cloud SDK installed (https://cloud.google.com/sdk/docs/install)
- Firebase CLI installed (`npm install -g firebase-tools`)
- Administrative access to your Firebase project

### Steps to Apply CORS Configuration

1. **Login to Firebase**

   ```bash
   firebase login
   ```

2. **Set your Firebase project**

   ```bash
   firebase use your-project-id
   ```

3. **Apply the CORS configuration**

   Use the `gsutil` command that comes with Google Cloud SDK:

   ```bash
   gsutil cors set cors.json gs://your-storage-bucket-name
   ```

   Replace `your-storage-bucket-name` with your actual Firebase Storage bucket name, which typically looks like `your-project-id.appspot.com`.

4. **Verify the configuration**

   ```bash
   gsutil cors get gs://your-storage-bucket-name
   ```

   This should output the CORS configuration you just applied.

## Troubleshooting

If you encounter CORS-related errors in your application:

1. Check browser console for specific CORS error messages
2. Verify that the CORS configuration was applied correctly
3. Ensure your storage rules allow the operations you're attempting
4. Remember that Firebase Storage URLs are temporary and expire

## Additional Security Considerations

While the CORS configuration allows requests from any origin (`*`), security is maintained through:

1. Firebase Authentication - Users must be authenticated to access files
2. Firebase Storage Rules - Define who can read and write specific files
3. Short-lived download URLs - Expire after a defined period

For more information, see the [Firebase Storage Documentation](https://firebase.google.com/docs/storage). 
 
 
 
 
 
 
 
 
 
 