import json
import os
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class MetadataStorage:
    def __init__(self, storage_file: str = "metadata_storage.json"):
        self.storage_file = storage_file
        self.metadata = {}
        self._load_metadata()

    def _load_metadata(self) -> None:
        """Load metadata from the storage file."""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    self.metadata = json.load(f)
                logger.info(f"Loaded metadata from {self.storage_file}")
            else:
                self.metadata = {}
                logger.info("No existing metadata file found, starting with empty storage")
        except Exception as e:
            logger.error(f"Error loading metadata: {str(e)}")
            self.metadata = {}

    def _save_metadata(self) -> None:
        """Save metadata to the storage file."""
        try:
            with open(self.storage_file, 'w') as f:
                json.dump(self.metadata, f, indent=2)
            logger.info(f"Saved metadata to {self.storage_file}")
        except Exception as e:
            logger.error(f"Error saving metadata: {str(e)}")

    def add_metadata(self, metadata: Dict, document_url: str) -> None:
        """Add or update metadata for a document."""
        try:
            self.metadata[document_url] = metadata
            self._save_metadata()
            logger.info(f"Added/updated metadata for document: {document_url}")
        except Exception as e:
            logger.error(f"Error adding metadata: {str(e)}")
            raise

    def get_metadata(self) -> List[Dict]:
        """Get all stored metadata."""
        return [{"Document URL": url, **data} for url, data in self.metadata.items()]

    def get_metadata_by_url(self, document_url: str) -> Optional[Dict]:
        """Get metadata for a specific document."""
        return self.metadata.get(document_url)

    def delete_metadata(self, document_url: str) -> None:
        """Delete metadata for a specific document."""
        try:
            if document_url in self.metadata:
                del self.metadata[document_url]
                self._save_metadata()
                logger.info(f"Deleted metadata for document: {document_url}")
        except Exception as e:
            logger.error(f"Error deleting metadata: {str(e)}")
            raise

    def clear_metadata(self) -> None:
        """Clear all stored metadata."""
        try:
            self.metadata = {}
            self._save_metadata()
            logger.info("Cleared all metadata")
        except Exception as e:
            logger.error(f"Error clearing metadata: {str(e)}")
            raise 