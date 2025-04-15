from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLAlchemyEnum, ForeignKey
from sqlalchemy.orm import relationship

from ..db.base import Base

class BatchStatus(str, Enum):
    """Enum for batch status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Batch(Base):
    """SQLAlchemy model for audio file batch"""
    __tablename__ = "batches"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLAlchemyEnum(BatchStatus), default=BatchStatus.PENDING)
    
    # Relationship to audio files
    audio_files = relationship("AudioFile", back_populates="batch")

class AudioFile(Base):
    """SQLAlchemy model for audio file"""
    __tablename__ = "audio_files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    original_filename = Column(String)
    content_type = Column(String)
    size = Column(Integer)
    file_path = Column(String)
    file_url = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Integer, default=0)  # 0: not processed, 1: processed, -1: error
    
    # Foreign key to batch
    batch_id = Column(Integer, ForeignKey("batches.id"))
    batch = relationship("Batch", back_populates="audio_files")

# Pydantic models for API
class AudioFileCreate(BaseModel):
    """Schema for creating an audio file record"""
    filename: str
    original_filename: str
    content_type: str
    size: int
    file_path: str
    file_url: str
    batch_id: int

class AudioFileResponse(BaseModel):
    """Schema for audio file response"""
    id: int
    filename: str
    original_filename: str
    content_type: str
    size: int
    file_url: str
    uploaded_at: datetime
    processed: int
    
    class Config:
        from_attributes = True

class BatchCreate(BaseModel):
    """Schema for creating a batch"""
    name: str

class BatchResponse(BaseModel):
    """Schema for batch response"""
    id: int
    name: str
    created_at: datetime
    status: BatchStatus
    audio_files: Optional[List[AudioFileResponse]] = None
    
    class Config:
        from_attributes = True 