# Voice Cloning and PDF Reader

A full-stack application that clones your voice and uses it to read PDF documents. Built with FastAPI, React, and Resemble AI for voice cloning.

## Features

- 🎤 Voice Recording & Upload
  - Record your voice directly in the browser
  - Upload existing voice recordings (WAV, MP3)
  - Voice preprocessing and analysis
  - Support for multiple voice samples

- 📄 PDF Processing
  - Upload and parse PDF documents
  - Extract text with formatting preserved
  - Support for multiple pages
  - Text preprocessing and cleaning

- 🗣️ Voice Cloning
  - High-quality voice cloning using Resemble AI
  - Voice analysis and preprocessing
  - Custom voice model training
  - Natural-sounding speech synthesis

- 🎵 Audio Playback
  - Interactive audio player
  - Playback speed control
  - Volume adjustment
  - Download in MP3/WAV formats
  - Real-time audio visualization

- 💻 Modern UI
  - React + Tailwind CSS
  - Responsive design
  - Dark mode support
  - Loading animations
  - Progress indicators
  - Error handling and notifications

## Tech Stack

### Backend
- FastAPI (Python web framework)
- Coqui TTS / Bark
- Resemble AI (Voice cloning)
- PyTorch (Deep learning)
- Whisper (Speech recognition)
- FFmpeg (Audio processing)
- python-dotenv (Environment management)
- PyPDF2 (PDF processing)

### Frontend
- React (UI framework)
- Tailwind CSS (Styling)
- Web Audio API (Audio processing)
- Heroicons (Icons)
- Axios (HTTP client)
- React Router (Navigation)

## Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- FFmpeg
- Git
- CUDA-capable GPU (recommended for faster processing)
- Resemble AI API key

### Backend Setup
```bash
# Clone the repository
git clone [repository-url]
cd [repository-name]

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration, including RESEMBLE_API_KEY

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
npm start
```

## Usage

1. **Voice Cloning**
   - Record a voice sample (minimum 30 seconds recommended)
   - Upload multiple samples for better quality
   - Wait for voice analysis and model training
   - Test the cloned voice with sample text

2. **PDF Processing**
   - Upload PDF document
   - Review extracted text
   - Edit text if needed
   - Select voice parameters

3. **Text-to-Speech**
   - Click "Generate Speech"
   - Monitor progress
   - Use audio player controls
   - Download in preferred format

## API Endpoints

### Voice Management
- `POST /api/voice/upload` - Upload voice recording
- `POST /api/voice/clone` - Train voice model
- `GET /api/voice/models` - List available models
- `DELETE /api/voice/models/{model_id}` - Delete voice model

### PDF Processing
- `POST /api/pdf/upload` - Upload PDF document
- `GET /api/pdf/{id}/text` - Get extracted text
- `POST /api/pdf/{id}/read` - Generate speech from text
- `GET /api/pdf/{id}/audio` - Get generated audio

## Environment Variables

### Backend (.env)
```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Voice Cloning
RESEMBLE_API_KEY=your_api_key_here
VOICE_MODELS_DIR=models/voice
AUDIO_OUTPUT_DIR=output/audio
MAX_UPLOAD_SIZE=10485760  # 10MB

# PDF Processing
PDF_UPLOAD_DIR=uploads/pdf
MAX_PDF_SIZE=20971520  # 20MB

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_MAX_RECORDING_TIME=300  # seconds
REACT_APP_MAX_UPLOAD_SIZE=10485760  # 10MB
```

## Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Style
- Backend: Follow PEP 8 guidelines
- Frontend: ESLint and Prettier configuration




## Acknowledgments

- [Resemble AI](https://www.resemble.ai/)
- [Coqui TTS](https://github.com/coqui-ai/TTS)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/) 
