# Weather Forecast App

This application allows users to get current and 7-day weather forecasts for any city using the OpenWeatherMap API. It also generates an AI-powered weather report using Gemini's `gemini-1.5-pro` model. The app is built with FastAPI for the backend and Streamlit for the frontend.

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

Create a `.env` file in the project directory and add your API keys:
```plaintext
GEMINI_API_KEY=your_gemini_api_key
WEATHER_API_KEY=your_openweathermap_api_key
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

- Enter a city name in the input field and click "Get Weather Report."
- View the current weather, 7-day forecast, and AI-generated weather report.
- The app uses weather icons to enhance readability.

## Technologies Used

- **FastAPI** - Backend API
- **Streamlit** - Frontend UI
- **Google Gemini AI** - AI-generated weather reports
- **OpenWeatherMap API** - Fetching weather data

