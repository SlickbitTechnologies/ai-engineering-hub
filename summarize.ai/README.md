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