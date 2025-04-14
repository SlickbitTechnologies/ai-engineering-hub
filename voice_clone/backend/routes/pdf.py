from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import PyPDF2
import os
import time
from pathlib import Path
from services.tts import voice_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Create uploads directory if it doesn't exist
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)
        
        # Save the uploaded file
        file_path = uploads_dir / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        # Extract text from PDF
        text = ""
        with open(file_path, "rb") as pdf_file:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            for page in pdf_reader.pages:
                text += page.extract_text()
                
        # Clean up the uploaded file
        os.remove(file_path)
        
        return {"text": text}
    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/read-text")
async def read_text(text: str, background_tasks: BackgroundTasks):
    try:
        # Get the latest voice file
        voices_dir = Path("voices")
        voice_files = list(voices_dir.glob("*.wav"))
        if not voice_files:
            raise HTTPException(status_code=400, detail="No voice file found. Please record or upload a voice first.")
            
        # Use the most recent voice file
        latest_voice = max(voice_files, key=lambda x: x.stat().st_mtime)
        
        # Generate speech using Resemble AI
        result = voice_service.generate_speech(text, str(latest_voice))
        
        # Wait for the file to be fully written
        output_path = Path("voices") / result["audio_url"].split("/")[-1]
        max_attempts = 10
        for attempt in range(max_attempts):
            if output_path.exists() and output_path.stat().st_size > 0:
                break
            time.sleep(0.5)
            
        if not output_path.exists() or output_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="Failed to generate audio file")
            
        # Return the audio file
        return FileResponse(
            str(output_path),
            media_type="audio/mpeg",
            background=background_tasks,
            filename=output_path.name
        )
    except Exception as e:
        logger.error(f"Error generating speech: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 