from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query, status
from sqlalchemy.orm import Session

from ....database import get_db
from ....models.batch import BatchCreate, BatchResponse, AudioFileResponse, BatchStatus, AudioFileCreate
from ....repositories.batch_repository import BatchRepository, AudioFileRepository
from ....services.storage_service import StorageService

router = APIRouter()

@router.get("/test", status_code=status.HTTP_200_OK)
async def test_analyze_router():
    """Test endpoint to verify the analyze router is working"""
    return {"message": "Analyze API is working!"}

@router.post("/batches", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_batch(
    batch: BatchCreate,
    db: Session = Depends(get_db)
):
    """Create a new batch for audio file uploads"""
    db_batch = BatchRepository.create_batch(db, batch)
    return db_batch

@router.get("/batches", response_model=List[BatchResponse])
async def get_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all batches"""
    batches = BatchRepository.get_batches(db, skip=skip, limit=limit)
    return batches

@router.get("/batches/{batch_id}", response_model=BatchResponse)
async def get_batch(
    batch_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific batch by ID"""
    db_batch = BatchRepository.get_batch(db, batch_id)
    if db_batch is None:
        raise HTTPException(status_code=404, detail="Batch not found")
    return db_batch

@router.post("/batches/{batch_id}/upload", response_model=List[AudioFileResponse])
async def upload_files(
    batch_id: int,
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Upload multiple audio files to a batch"""
    # Verify batch exists
    db_batch = BatchRepository.get_batch(db, batch_id)
    if db_batch is None:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # Check if any files were provided
    if files is None or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files were provided")
    
    # Update batch status to processing
    BatchRepository.update_batch_status(db, batch_id, BatchStatus.PROCESSING)
    
    uploaded_files = []
    
    # Process each file
    for file in files:
        # Validate file type
        if not file.content_type.startswith('audio/'):
            continue
        
        # Upload to Firebase
        file_info = await StorageService.upload_file(
            file=file,
            folder=f"audio_files/batch_{batch_id}"
        )
        
        # Create database record
        audio_file_data = {
            "filename": file_info["filename"],
            "original_filename": file.filename,
            "content_type": file_info["content_type"],
            "size": file_info["size"],
            "file_path": file_info["path"],
            "file_url": file_info["url"],
            "batch_id": batch_id
        }
        
        # Create audio file record
        db_audio_file = AudioFileRepository.create_audio_file(
            db, 
            AudioFileCreate(**audio_file_data)
        )
        
        uploaded_files.append(db_audio_file)
    
    # Update batch status if no files were uploaded
    if not uploaded_files:
        BatchRepository.update_batch_status(db, batch_id, BatchStatus.FAILED)
        raise HTTPException(status_code=400, detail="No valid audio files were uploaded")
    
    # Add background task to process the files
    # background_tasks.add_task(process_audio_files, batch_id)
    
    return uploaded_files

@router.put("/batches/{batch_id}/status", response_model=BatchResponse)
async def update_batch_status(
    batch_id: int,
    status: BatchStatus,
    db: Session = Depends(get_db)
):
    """Update batch status"""
    db_batch = BatchRepository.update_batch_status(db, batch_id, status)
    if db_batch is None:
        raise HTTPException(status_code=404, detail="Batch not found")
    return db_batch 