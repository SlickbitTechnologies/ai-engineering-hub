# Summarize.AI

**Summarize Anything, Instantly!**

Summarize.AI is a multi-functional tool designed to generate quick summaries from various types of content. It allows users to extract key insights from websites, PDF documents, audio files, and text, as well as provide instant translation services.

## Features

- **Website Summarization**: Paste a URL to quickly summarize the content of a website.
- **PDF Summarization**: Upload PDF files to receive concise summaries.
- **Audio Summarization**: Convert audio files to text and generate AI-powered notes.
- **Text Summarization**: Paste raw text to receive an instant summary.
- **Translation**: Translate text between different languages.
- **History**: Access saved summaries with timestamps for future reference.
- **Daily Summary Limit**: 5 free summaries per day with upgrade options for more.

## Tech Stack

- **Frontend**:
  - Next.js: A React framework for building fast and SEO-friendly web applications
  - Tailwind CSS: Utility-first CSS framework for rapid UI development
  - shadcn: Pre-built components for UI consistency
  - Redux Toolkit: State management

- **Backend & AI Services**:
  - Firebase: Authentication, database, and hosting
  - Gemini AI: Powers the summarization and translation algorithms
  - Puppeteer: For website scraping
  - Tesseract.js: OCR operations on PDFs

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/summarize-ai.git
   cd summarize-ai
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Website Summarization**:
   - Navigate to the "Web Scrape" section
   - Enter a website URL
   - Click "Summarize" to generate a summary

2. **PDF Summarization**:
   - Go to the "PDF Summarize" section
   - Upload a PDF file
   - The system will extract text and generate a summary

3. **Audio Summarization**:
   - Access the "Audio Summarize" section
   - Upload an audio file
   - The system will convert speech to text and generate notes

4. **Text Summarization**:
   - Navigate to the "Text Summarize" section
   - Paste your text
   - Click "Summarize" to get a concise version

5. **Translation**:
   - Go to the "Translator" section
   - Enter text to translate
   - Select target language and click "Translate"

6. **View History**:
   - Access the "History" section to see all your saved summaries

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)
- [Gemini AI](https://gemini.google.com/)
- [Puppeteer](https://pptr.dev/)
- [Tesseract.js](https://tesseract.projectnaptha.com/)

## Deployment

### Vercel Deployment

To deploy the application to Vercel, follow these steps:

1. **Environment Variables Setup**:
   Make sure all environment variables are properly configured in Vercel:
   - Go to your Vercel project dashboard
   - Navigate to "Settings" → "Environment Variables"
   - Add all variables from your `.env.local` file:
     ```
     # OpenAI API Keys
     OPENAI_API_KEY=your_openai_api_key
     
     # Gemini API Keys
     GEMINI_API_KEY=your_gemini_api_key
     NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
     
     # Firebase Configuration
     NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
     NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
     ```

2. **Build Optimization**:
   Recent changes to ensure successful deployment:
   - Updated route configuration to use Next.js 14 App Router format
   - Removed deprecated `serverActions` flag from `next.config.js`
   - Updated API route configuration for better performance
   - Fixed React hooks and ESLint issues

3. **Deployment Commands**:
   ```
   npm run build
   npm run start
   ```

4. **Limits and Considerations**:
   - Free tier Vercel has a 4.5MB request size limit
   - For handling larger files (like PDFs or audio), consider upgrading to a Pro plan
   - Set appropriate timeout values for API routes that need more processing time

### Troubleshooting

If you encounter deployment issues:

1. **API Route Timeouts**: 
   Check the `maxDuration` settings in API route files

2. **File Size Limits**:
   Implement client-side validation for file uploads

3. **Build Errors**:
   Run `npm run build` locally to identify and fix any build issues before deployment 