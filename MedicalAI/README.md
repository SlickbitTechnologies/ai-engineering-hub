# MediAId - Medicine Information App

MediAId is an AI-powered application that provides detailed medical reports for medicines. It uses FastAPI as the backend and Streamlit as the frontend, integrating Google Gemini AI (`gemini-1.5-pro-latest`) to generate accurate and structured medicine information.

## Steps to Run the Project

Follow these steps to set up and run the project successfully:

### 1. Set Up the Virtual Environment

Create a virtual environment using the following command:
```bash
python -m venv .venv
```
Activate the virtual environment:

For Windows:
```bash
.venv\Scripts\activate
```
For macOS/Linux:
```bash
source .venv/bin/activate
```

### 2. Set Up the Environment Variables

Create a `.env` file in the project directory and add your API key:
```plaintext
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Install Dependencies

Use the following command to install the required dependencies:
```bash
pip install -r requirements.txt
```

### 4. Run the Backend (FastAPI)

Start the FastAPI server:
```bash
uvicorn main:app --reload
```

### 5. Run the Frontend (Streamlit)

Start the Streamlit app:
```bash
streamlit run app.py
```

### 6. Usage

- Enter the medicine name in the input field and click "Get Medicine Info."
- The app will fetch a detailed report about the medicine using Google Gemini AI.
- Information provided includes composition, uses, dosage, side effects, contraindications, drug interactions, and more.

## Technologies Used

- **FastAPI** - Backend API
- **Streamlit** - Frontend UI
- **Google Gemini AI** - AI-powered medicine reports
- **Requests** - Handling API requests between frontend and backend

## Features

- AI-generated medicine information with structured details.
- User-friendly Streamlit interface.
- FastAPI backend with CORS enabled for seamless frontend-backend interaction.
- Secure API key management using environment variables.
- Easy deployment and scalability.

## Future Enhancements

- Integrate a medicine database for cross-checking AI-generated reports.
- Add voice search for medicine queries.
- Implement user authentication and profile management.
- Expand AI model integration for more in-depth medical insights.

---
This project provides an efficient way to obtain comprehensive medicine information, helping users make informed decisions about their medications.

