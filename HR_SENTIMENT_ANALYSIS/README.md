# HR Sentiment Analysis Platform

A comprehensive platform for analyzing employee feedback and sentiment data to generate actionable insights for HR departments.

## Project Overview

This application allows HR teams to:
- Upload employee feedback files (CSV, XLSX, or JSON)
- Analyze sentiment data using advanced AI (GROQ API)
- Visualize sentiment trends and key themes
- Generate and track actionable recommendations
- Configure integration settings

## Architecture

The project consists of two main components:

### Backend (FastAPI)
- RESTful API endpoints for data processing
- File upload and processing capabilities
- Sentiment analysis using GROQ API
- Data storage and management

### Frontend (React + TypeScript + Vite)
- Modern, responsive UI built with React
- TypeScript for type safety
- Vite for fast development experience
- Chart.js for data visualization

## Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install required packages:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your GROQ API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. Start the backend server:
   ```
   python main.py
   ```
   The server will run at http://localhost:8000

### Frontend Setup
1. Navigate to the project directory:
   ```
   cd project
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   The application will be available at http://localhost:8080 (or another port if 8080 is in use)

## Features

### Upload and Analysis
- Upload employee feedback files in various formats
- Automatic sentiment analysis of feedback
- Extract key themes and topics

### Dashboard
- Overview of sentiment metrics
- Visual representation of sentiment distribution
- Top themes and their sentiment trends

### Sentiment Analysis
- Detailed breakdown of sentiment categories
- Theme analysis with frequency metrics
- Comparative analysis over time

### HR Recommendations
- AI-generated recommendations based on sentiment data
- Track recommendation status (New, Implemented, Dismissed)
- Sort and filter recommendations by impact level and department

### Settings
- Configure API integration settings
- Manage user roles
- View historical reports

## API Documentation

The backend exposes the following key endpoints:

- `GET /api/sentiment`: Get current sentiment data
- `POST /api/upload`: Upload files for analysis
- `GET /api/uploads`: List all uploaded files
- `POST /api/uploads/{file_id}/analyze`: Analyze a specific uploaded file
- `GET /api/uploads/analyze-all`: Analyze all uploaded files
- `GET /api/recommendations`: Get all recommendations
- `POST /api/recommendations`: Create a new recommendation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request. 