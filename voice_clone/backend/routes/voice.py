from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.responses import JSONResponse
import os
from pathlib import Path
from typing import List
import logging
from ..services.utils import save_upload_file, ensure_directories, get_file_size
from ..services.tts import tts_service, VoiceCloningService

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()
voice_service = VoiceCloningService()

# Directory to store uploaded voices
VOICE_UPLOAD_DIR = Path("voices")
VOICE_UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_voice(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
) -> JSONResponse:
    """
    Upload a voice sample for cloning
    """
    try:
        # Ensure directories exist
        ensure_directories()
        
        # Validate file type
        if not file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an audio file"
            )
        
        # Save the uploaded file
        upload_dir = os.getenv("VOICE_UPLOAD_DIR")
        file_path = await save_upload_file(file, upload_dir)
        
        # Start voice cloning in background
        if background_tasks:
            background_tasks.add_task(
                tts_service.clone_voice,
                audio_path=file_path,
                language="en"  # Explicitly set language to English
            )
        
        return JSONResponse(
            status_code=202,
            content={
                "message": "Voice sample uploaded successfully",
                "file_path": file_path
            }
        )
        
    except Exception as e:
        logger.error(f"Error uploading voice sample: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading voice sample: {str(e)}"
        )

@router.get("/list")
async def list_voices() -> JSONResponse:
    """
    List all available voice models
    """
    try:
        voice_models_dir = os.getenv("VOICE_MODELS_DIR")
        models = []
        
        # Get all .npy files (voice model embeddings)
        for file in Path(voice_models_dir).glob("*.npy"):
            models.append({
                "name": file.stem,
                "path": str(file),
                "size": get_file_size(str(file)),
                "created_at": file.stat().st_ctime
            })
        
        return JSONResponse(
            content={
                "models": models
            }
        )
        
    except Exception as e:
        logger.error(f"Error listing voice models: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error listing voice models: {str(e)}"
        )

@router.post("/clone")
async def clone_voice(file: UploadFile = File(...)):
    try:
        # Save the uploaded file
        file_path = VOICE_UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Sample text for voice cloning
        sample_text = """
        Hello, this is a sample text for voice cloning. 
        Please read this text clearly and naturally. 
        The more natural and consistent your reading, 
        the better the voice cloning will work.
        """

        # Clone the voice
        cloned_voice_path = voice_service.clone_voice(str(file_path), sample_text)
        
        # Return the path to the cloned voice
        return {"voice_path": os.path.basename(cloned_voice_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/read")
async def read_text(text: str, voice_path: str):
    try:
        # Generate speech using the cloned voice
        speech_path = voice_service.generate_speech(text, str(VOICE_UPLOAD_DIR / voice_path))
        
        # Return the path to the generated speech
        return {"audio_path": os.path.basename(speech_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 