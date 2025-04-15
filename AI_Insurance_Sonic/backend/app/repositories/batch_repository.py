from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.batch import Batch, AudioFile, BatchStatus, AudioFileCreate, BatchCreate

class BatchRepository:
    """Repository for batch operations"""
    
    @staticmethod
    def create_batch(db: Session, batch: BatchCreate) -> Batch:
        """Create a new batch"""
        db_batch = Batch(name=batch.name, status=BatchStatus.PENDING)
        db.add(db_batch)
        db.commit()
        db.refresh(db_batch)
        return db_batch
    
    @staticmethod
    def get_batch(db: Session, batch_id: int) -> Optional[Batch]:
        """Get a batch by ID"""
        return db.query(Batch).filter(Batch.id == batch_id).first()
    
    @staticmethod
    def get_batches(db: Session, skip: int = 0, limit: int = 100) -> List[Batch]:
        """Get all batches"""
        return db.query(Batch).order_by(Batch.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_batch_status(db: Session, batch_id: int, status: BatchStatus) -> Optional[Batch]:
        """Update batch status"""
        db_batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if db_batch:
            db_batch.status = status
            db.commit()
            db.refresh(db_batch)
        return db_batch

class AudioFileRepository:
    """Repository for audio file operations"""
    
    @staticmethod
    def create_audio_file(db: Session, audio_file: AudioFileCreate) -> AudioFile:
        """Create a new audio file record"""
        db_audio_file = AudioFile(
            filename=audio_file.filename,
            original_filename=audio_file.original_filename,
            content_type=audio_file.content_type,
            size=audio_file.size,
            file_path=audio_file.file_path,
            file_url=audio_file.file_url,
            batch_id=audio_file.batch_id
        )
        db.add(db_audio_file)
        db.commit()
        db.refresh(db_audio_file)
        return db_audio_file
    
    @staticmethod
    def get_audio_file(db: Session, audio_file_id: int) -> Optional[AudioFile]:
        """Get an audio file by ID"""
        return db.query(AudioFile).filter(AudioFile.id == audio_file_id).first()
    
    @staticmethod
    def get_audio_files_by_batch(db: Session, batch_id: int) -> List[AudioFile]:
        """Get all audio files for a batch"""
        return db.query(AudioFile).filter(AudioFile.batch_id == batch_id).all()
    
    @staticmethod
    def update_audio_file_processed(db: Session, audio_file_id: int, processed: int) -> Optional[AudioFile]:
        """Update audio file processed status (0: not processed, 1: processed, -1: error)"""
        db_audio_file = db.query(AudioFile).filter(AudioFile.id == audio_file_id).first()
        if db_audio_file:
            db_audio_file.processed = processed
            db.commit()
            db.refresh(db_audio_file)
        return db_audio_file 