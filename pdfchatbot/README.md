# PDF Chatbot

A Streamlit application that allows you to upload PDF documents and ask questions about their content using Google's Gemini LLM.

## Features

- PDF document upload (max 2MB)
- Text extraction from PDF
- Interactive chat interface
- Question answering using Gemini LLM
- Persistent chat history during session

## Setup

1. Clone this repository
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the root directory and add your Google API key:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```
   You can get a Google API key from: https://makersuite.google.com/app/apikey

## Running the Application

To run the application, execute:
```bash
streamlit run app.py
```

The application will open in your default web browser.

## Usage

1. Upload a PDF file (max 2MB)
2. Wait for the PDF to be processed
3. Start asking questions about the content of your PDF
4. The chatbot will provide answers based on the PDF content

## Note

- The application has a 2MB file size limit for PDF uploads
- The chat history is maintained during the session but will be cleared when you refresh the page
- Make sure your PDF is text-based for best results 