# Resume Information Extractor

This Streamlit application analyzes resumes (PDF or DOCX format) using Google's Gemini LLM to extract and present key information in a structured format. It provides both educational background details and a comprehensive skills analysis focused on Python development and AI/ML capabilities.

## Features

- Upload PDF or DOCX resume files
- Flexible API key configuration:
  - Use environment variables or
  - Input securely through the web interface
- Extract and analyze:
  - Education information (institution, years, degrees, marks)
  - Skills relevant to Python/AI development:
    - Programming languages proficiency
    - AI/ML frameworks and libraries
    - Software development tools and practices
    - Cloud platforms and deployment experience
    - Relevant projects
- Display information in organized sections:
  - Education details in tabular format
  - Skills summary in categorized bullet points
- Download education information as CSV
- Handle missing information gracefully

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your Google API key (choose one method):

   ### Method 1: Environment Variable (recommended for development)
   - Get your API key from the Google Cloud Console
   - Create a `.env` file in the project root directory
   - Add your API key to the `.env` file:
   ```
   GOOGLE_API_KEY=your-api-key-here
   ```

   ### Method 2: Web Interface
   - Get your API key from the Google Cloud Console
   - Launch the application
   - Enter your API key in the sidebar input field (it will be securely masked)

## Running the Application

Run the Streamlit app:
```bash
streamlit run app.py
```

The application will open in your default web browser.

## Usage

1. If not using environment variables, enter your Google API key in the sidebar
2. Click on the "Choose a file" button to upload your resume (PDF or DOCX)
3. Wait for the processing to complete
4. View the extracted information:
   - Education details in a table format
   - Skills summary focused on Python and AI development capabilities
5. Optionally, download the education information as a CSV file

## Note

- Make sure you have a valid Google API key with access to the Gemini API
- The application requires an active internet connection to process the resumes
- The skills analysis is specifically tailored for Python development and AI/ML roles
- Your API key is securely masked when entered through the web interface

## Security

- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file if using git
- The API key input in the web interface is masked and not stored permanently 