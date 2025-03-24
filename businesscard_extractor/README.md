# Business Card Data Extractor

This application extracts information from business card images and saves it to Excel files using FastAPI, Streamlit, and Groq LLM.

## Features

- Upload business card images
- Extract key information (Name, Company, Designation, Mobile Number)
- Save extracted data to Excel files
- Modern and user-friendly interface

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the root directory and add your Groq API key:
```
GROQ_API_KEY=your_api_key_here
```

3. Start the FastAPI backend:
```bash
uvicorn main:app --reload
```

4. In a new terminal, start the Streamlit frontend:
```bash
streamlit run front_app.py
```

## Usage

1. Open your browser and go to http://localhost:8501
2. Upload a business card image
3. Click "Extract Information"
4. Review the extracted information
5. Click "Save to Excel" to save the data

## Project Structure

```
businesscard_extractor/
├──  main.py 
├── front_app.py 
├── requirements.txt
└── README.md
```

## Requirements

- Python 3.8+
- Groq API key
- Internet connection for API calls 