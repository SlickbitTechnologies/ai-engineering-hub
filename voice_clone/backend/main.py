from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from TTS.api import TTS
import PyPDF2
import shutil
from pydantic import BaseModel
import time

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Voice Clone API",
    description="API for voice cloning and PDF text-to-speech",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize TTS with YourTTS model
tts = TTS(model_name="tts_models/multilingual/multi-dataset/your_tts",
          progress_bar=False,
          gpu=False)

# Create necessary directories
UPLOAD_DIR = Path("uploads")
VOICE_UPLOAD_DIR = UPLOAD_DIR / "voices"
PDF_UPLOAD_DIR = UPLOAD_DIR / "pdfs"
VOICE_MODELS_DIR = Path("models/voices")
AUDIO_OUTPUT_DIR = Path("output/audio")

for directory in [UPLOAD_DIR, VOICE_UPLOAD_DIR, PDF_UPLOAD_DIR, VOICE_MODELS_DIR, AUDIO_OUTPUT_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Mount static directories
app.mount("/audio", StaticFiles(directory=str(AUDIO_OUTPUT_DIR)), name="audio")

async def save_upload_file(file: UploadFile, upload_dir: Path) -> str:
    """Save uploaded file to specified directory"""
    try:
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return str(file_path)
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF file"""
    try:
        text = ""
        with open(pdf_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class TextToSpeechRequest(BaseModel):
    text: str
    voice_path: str

@app.post("/api/voice/clone")
async def clone_voice(file: UploadFile = File(...)):
    """Clone a voice from an audio file"""
    try:
        # Validate file type
        if not file.filename.endswith(('.wav', '.mp3')):
            raise HTTPException(
                status_code=400,
                detail="Only WAV and MP3 files are allowed"
            )
            
        # Save the uploaded file
        audio_path = VOICE_UPLOAD_DIR / file.filename
        with open(audio_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Generate output path for cloned voice
        output_path = VOICE_MODELS_DIR / f"cloned_{audio_path.stem}.wav"
        
        # Clone the voice with a longer test sentence for better voice capture
        test_text = "This is a voice cloning test. I hope it captures my voice characteristics well."
        tts.tts_to_file(
            text=test_text,
            speaker_wav=str(audio_path),
            file_path=str(output_path),
            language="en"
        )
            
        return JSONResponse({
            "message": "Voice cloned successfully",
            "voice_path": str(output_path)
        })
        
    except Exception as e:
        logger.error(f"Error cloning voice: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error cloning voice: {str(e)}"
        )

@app.post("/api/pdf/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF file and extract its text"""
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are allowed"
            )
            
        # Save the uploaded file
        pdf_path = await save_upload_file(file, PDF_UPLOAD_DIR)
        
        # Extract text from PDF
        text = extract_text_from_pdf(pdf_path)
        
        return JSONResponse({
            "message": "PDF uploaded and processed successfully",
            "file_path": pdf_path,
            "text": text
        })
        
    except Exception as e:
        logger.error(f"Error processing PDF upload: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing PDF: {str(e)}"
        )

@app.post("/api/pdf/read")
async def read_pdf_text(request: TextToSpeechRequest):
    """Generate speech from extracted text using a cloned voice"""
    try:
        # Validate voice path exists
        voice_path = Path(request.voice_path)
        if not voice_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Voice file not found at path: {voice_path}"
            )
        
        # Validate text is not empty
        if not request.text.strip():
            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty"
            )

        # Generate output path with timestamp
        timestamp = int(time.time())
        output_filename = f"speech_{timestamp}.wav"
        output_path = AUDIO_OUTPUT_DIR / output_filename
        
        # Generate speech using the cloned voice
        try:
            tts.tts_to_file(
                text=request.text,
                speaker_wav=str(voice_path),
                file_path=str(output_path),
                language="en"
            )
        except Exception as e:
            logger.error(f"TTS generation error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate speech with the cloned voice"
            )
            
        # Verify the file was created
        if not output_path.exists():
            raise HTTPException(
                status_code=500,
                detail="Failed to generate audio file"
            )
            
        return JSONResponse({
            "message": "Speech generated successfully",
            "audio_path": f"/audio/{output_filename}"
        })
        
    except Exception as e:
        logger.error(f"Error generating speech: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating speech: {str(e)}"
        )

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "status": "healthy",
        "message": "Voice Clone API is running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 