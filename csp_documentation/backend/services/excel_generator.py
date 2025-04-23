import os
import pandas as pd
from typing import Dict
import logging
from datetime import datetime
import re
import time
from services.metadata_storage import MetadataStorage
import openpyxl

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExcelGenerator:
    def __init__(self, output_dir: str = "output"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.excel_filename = "extracted_data.xlsx"
        self.excel_path = os.path.join(self.output_dir, self.excel_filename)
        self.logger = logging.getLogger(__name__)
        self.metadata_storage = MetadataStorage()
        self._load_existing_data()

    def _load_existing_data(self):
        """Load existing data from both Excel and metadata storage"""
        try:
            # Initialize lists
            self.metadata_list = []
            self.document_urls = []
            
            # Load from metadata storage
            stored_metadata = self.metadata_storage.get_metadata()
            if stored_metadata:
                for doc in stored_metadata:
                    if 'File Name' in doc:
                        self.metadata_list.append(doc)
                        self.document_urls.append(doc['File Name'])
                self.logger.info(f"Loaded {len(self.metadata_list)} documents from metadata storage")
                return

            # Fallback to Excel if no stored metadata
            if os.path.exists(self.excel_path):
                df = pd.read_excel(self.excel_path)
                if not df.empty:
                    self.metadata_list = df.to_dict(orient='records')
                    self.document_urls = [doc.get('File Name', '') for doc in self.metadata_list]
                    self.logger.info(f"Loaded {len(self.metadata_list)} documents from Excel")
        except Exception as e:
            self.logger.error(f"Error loading existing data: {e}")
            # Initialize empty lists if there's an error
            self.metadata_list = []
            self.document_urls = []

    def _extract_nct_id(self, url: str) -> str:
        try:
            match = re.search(r'NCT\d{8}', url)
            if match:
                return match.group(0)
            return "N/A"
        except Exception as e:
            self.logger.error(f"Error extracting NCT ID: {str(e)}")
            return "N/A"

    def add_metadata(self, metadata: Dict, document_url: str) -> str:
        try:
            # Extract file name from webUrl after Documents/
            if 'sharepoint.com' in document_url.lower():
                try:
                    # Split by Documents/ and get the last part
                    file_name = document_url.split('Documents/')[-1]
                    # Remove any URL encoding
                    file_name = file_name.replace('%20', ' ')
                except:
                    # Fallback to base name if splitting fails
                    file_name = os.path.basename(document_url)
            else:
                # For local files, just use the base name
                file_name = os.path.basename(document_url)
            
            # Add file name to metadata
            metadata['File Name'] = file_name
            
            # Remove Document URL from metadata
            if 'Document URL' in metadata:
                del metadata['Document URL']
            
            # Add to metadata storage
            self.metadata_storage.add_metadata(metadata, file_name)
            
            # Always append new metadata
            self.metadata_list.append(metadata)
            self.document_urls.append(file_name)
            logger.info(f"Added new metadata for file: {file_name}")

            # Generate Excel with all accumulated metadata
            return self.generate_excel()

        except Exception as e:
            logger.error(f"Error adding metadata: {str(e)}")
            raise

    def generate_excel(self) -> str:
        """Generate Excel file with all metadata."""
        try:
            # Create output directory if it doesn't exist
            os.makedirs(self.output_dir, exist_ok=True)
            
            # Create Excel file path
            excel_path = os.path.join(self.output_dir, 'extracted_data.xlsx')
            
            # Create DataFrame from metadata
            df = pd.DataFrame(self.metadata_list)
            
            # Create Excel writer
            with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
                # Write DataFrame to Excel
                df.to_excel(writer, sheet_name='Metadata', index=False)
                
                # Get workbook and worksheet
                workbook = writer.book
                worksheet = writer.sheets['Metadata']
                
                # Set column widths and enable text wrapping
                for idx, col in enumerate(df.columns):
                    # Set column width
                    worksheet.column_dimensions[chr(65 + idx)].width = 30
                    
                    # Enable text wrapping for all cells in this column
                    for row in range(2, len(df) + 2):  # Start from row 2 (after header)
                        cell = worksheet.cell(row=row, column=idx + 1)
                        cell.alignment = openpyxl.styles.Alignment(wrap_text=True, vertical='top')
                
                # Format header
                header_fill = openpyxl.styles.PatternFill(start_color='4F81BD', end_color='4F81BD', fill_type='solid')
                header_font = openpyxl.styles.Font(color='FFFFFF', bold=True)
                
                for cell in worksheet[1]:
                    cell.fill = header_fill
                    cell.font = header_font
                    cell.alignment = openpyxl.styles.Alignment(wrap_text=True, vertical='center')
            
            logger.info(f"Excel file generated successfully: {excel_path}")
            return excel_path
            
        except Exception as e:
            logger.error(f"Error generating Excel file: {str(e)}")
            raise

    def get_current_excel_path(self) -> str:
        return self.excel_path

    def clear_data(self) -> None:
        self.metadata_list = []
        self.document_urls = []
        self.metadata_storage._save_metadata()  # Clear the storage file
        logger.info("Cleared stored data")
