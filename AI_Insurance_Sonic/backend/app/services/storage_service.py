import uuid
import os
from datetime import datetime
from firebase_admin import storage
from fastapi import UploadFile
from ..config.firebase import get_storage_bucket, firebase_config
from ..core.config import settings

class StorageService:
    """Service for handling file storage operations"""
    
    @staticmethod
    async def upload_file(file: UploadFile, folder: str = "audio_files") -> dict:
        """
        Upload a file to Firebase Storage
        
        Args:
            file: The file to upload
            folder: The folder to store the file in
            
        Returns:
            dict: Information about the uploaded file
        """
        try:
            # Generate a unique filename with timestamp and UUID
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            extension = file.filename.split('.')[-1] if '.' in file.filename else ''
            safe_filename = f"{timestamp}_{unique_id}.{extension}"
            
            # Create the full path
            file_path = f"{folder}/{safe_filename}"
            
            # Check if we're in development mode (using mock Firebase credentials)
            if settings.MOCK_FIREBASE:
                return await StorageService._mock_upload_file(file, file_path)
            
            # Get the storage bucket
            bucket = get_storage_bucket()
            blob = bucket.blob(file_path)
            
            # Set the content type
            content_type = file.content_type
            
            # Read the file content
            file_content = await file.read()
            
            # Upload the file to Firebase Storage
            blob.upload_from_string(file_content, content_type=content_type)
            
            # Generate a signed URL that expires after a period (e.g., 1 hour)
            url = blob.generate_signed_url(
                version="v4",
                expiration=3600,  # 1 hour
                method="GET"
            )
            
            return {
                "filename": safe_filename,
                "content_type": content_type,
                "size": len(file_content),
                "path": file_path,
                "url": url
            }
        except Exception as e:
            print(f"Error uploading file to Firebase: {e}")
            # Fall back to mock implementation if real Firebase fails
            return await StorageService._mock_upload_file(file, file_path)
    
    @staticmethod
    async def _mock_upload_file(file: UploadFile, file_path: str) -> dict:
        """Mock implementation for development that doesn't use Firebase"""
        print(f"Using MOCK storage service - file will not be actually uploaded: {file_path}")
        
        # Read the file content to get its size
        file_content = await file.read()
        # Reset file pointer for future reads if needed
        await file.seek(0)
        
        # Generate a fake URL
        mock_url = f"{firebase_config['mock_storage_url']}/{file_path}"
        
        return {
            "filename": os.path.basename(file_path),
            "content_type": file.content_type,
            "size": len(file_content),
            "path": file_path,
            "url": mock_url
        }
    
    @staticmethod
    async def delete_file(file_path: str) -> bool:
        """
        Delete a file from Firebase Storage
        
        Args:
            file_path: The path of the file to delete
            
        Returns:
            bool: True if the file was deleted, False otherwise
        """
        try:
            # Check if we're in development mode
            if settings.MOCK_FIREBASE:
                print(f"Using MOCK storage service - pretending to delete: {file_path}")
                return True
                
            bucket = get_storage_bucket()
            blob = bucket.blob(file_path)
            blob.delete()
            return True
        except Exception as e:
            print(f"Error deleting file from Firebase: {e}")
            return False 