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
        self.logger = logging.getLogger(__name__)
        self.metadata_storage = MetadataStorage()
        self.template_excel_files = {}  # Store Excel paths for each template
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
                    if 'File Name' in doc and 'Template ID' in doc:
                        template_id = doc['Template ID']
                        if template_id not in self.template_excel_files:
                            self.template_excel_files[template_id] = os.path.join(
                                self.output_dir, 
                                f"extracted_data_{template_id}.xlsx"
                            )
                        self.metadata_list.append(doc)
                        self.document_urls.append(doc['File Name'])
                self.logger.info(f"Loaded {len(self.metadata_list)} documents from metadata storage")
                return

            # Fallback to Excel if no stored metadata
            for template_id, excel_path in self.template_excel_files.items():
                if os.path.exists(excel_path):
                    df = pd.read_excel(excel_path)
                    if not df.empty:
                        for _, row in df.iterrows():
                            doc = row.to_dict()
                            doc['Template ID'] = template_id
                            self.metadata_list.append(doc)
                            self.document_urls.append(doc.get('File Name', ''))
                        self.logger.info(f"Loaded {len(df)} documents from Excel for template {template_id}")
        except Exception as e:
            self.logger.error(f"Error loading existing data: {e}")
            # Initialize empty lists if there's an error
            self.metadata_list = []
            self.document_urls = []

    def _get_excel_path(self, template_id: str) -> str:
        """Get the Excel file path for a specific template"""
        if template_id not in self.template_excel_files:
            self.template_excel_files[template_id] = os.path.join(
                self.output_dir, 
                f"extracted_data_{template_id}.xlsx"
            )
        return self.template_excel_files[template_id]

    def _clean_metadata_value(self, value: str) -> str:
        """
        Clean metadata values to remove invalid characters for Excel.
        
        Args:
            value (str): The metadata value to clean
            
        Returns:
            str: Cleaned value safe for Excel
        """
        if not isinstance(value, str):
            return str(value)
            
        # Remove or replace invalid characters
        cleaned = value.replace('\x1b', '')  # Remove escape characters
        cleaned = cleaned.replace('\u0000', '')  # Remove null characters
        cleaned = cleaned.replace('\u0001', '')  # Remove control characters
        cleaned = cleaned.replace('\u0002', '')
        cleaned = cleaned.replace('\u0003', '')
        cleaned = cleaned.replace('\u0004', '')
        cleaned = cleaned.replace('\u0005', '')
        cleaned = cleaned.replace('\u0006', '')
        cleaned = cleaned.replace('\u0007', '')
        cleaned = cleaned.replace('\u0008', '')
        cleaned = cleaned.replace('\u0009', '')
        cleaned = cleaned.replace('\u000A', '')
        cleaned = cleaned.replace('\u000B', '')
        cleaned = cleaned.replace('\u000C', '')
        cleaned = cleaned.replace('\u000D', '')
        cleaned = cleaned.replace('\u000E', '')
        cleaned = cleaned.replace('\u000F', '')
        
        # Remove any remaining non-printable characters
        cleaned = ''.join(char for char in cleaned if char.isprintable())
        
        return cleaned.strip()

    def add_metadata(self, metadata: Dict, document_url: str, template_id: str) -> str:
        try:
            # Extract file name from webUrl after Documents/
            if 'sharepoint.com' in document_url.lower():
                try:
                    file_name = document_url.split('Documents/')[-1]
                    file_name = file_name.replace('%20', ' ')
                except:
                    file_name = os.path.basename(document_url)
            else:
                file_name = os.path.basename(document_url)
            
            # Get template fields from template context
            from context.template_context import TemplateContext
            template_context = TemplateContext()
            template = template_context.get_template(template_id)
            if not template:
                logger.error(f"No template found for template ID: {template_id}")
                raise ValueError(f"No template found for template ID: {template_id}")
            
            template_fields = template.get('metadataFields', [])
            if not template_fields:
                logger.error(f"No template fields found for template ID: {template_id}")
                raise ValueError(f"No template fields found for template ID: {template_id}")
            
            # Create a new metadata dict with only template fields
            cleaned_metadata = {}
            for field in template_fields:
                field_name = field.get('name')
                if field_name in metadata:
                    # Clean the value for Excel
                    cleaned_value = self._clean_metadata_value(metadata[field_name])
                    cleaned_metadata[field_name] = cleaned_value
                else:
                    cleaned_metadata[field_name] = "Not found"
            
            # Add required fields
            cleaned_metadata['File Name'] = file_name
            cleaned_metadata['Template ID'] = template_id
            
            # Add to metadata storage
            self.metadata_storage.add_metadata(cleaned_metadata, file_name)
            
            # Always append new metadata
            self.metadata_list.append(cleaned_metadata)
            self.document_urls.append(file_name)
            logger.info(f"Added new metadata for file: {file_name}")

            # Generate Excel with all accumulated metadata for this template
            return self.generate_excel(template_id)

        except Exception as e:
            logger.error(f"Error adding metadata: {str(e)}")
            raise

    def _sanitize_column_name(self, column_name: str) -> str:
        """Sanitize column name to be valid for Excel."""
        try:
            # Handle None or empty values
            if not column_name:
                return "Column"
                
            # Convert to string if not already
            column_name = str(column_name)
            
            # First, handle special cases for template-specific columns
            if '[' in column_name or ']' in column_name:
                # Extract content between square brackets if it exists
                import re
                bracket_content = re.findall(r'\[(.*?)\]', column_name)
                if bracket_content:
                    column_name = '_'.join(bracket_content)
                else:
                    # Remove brackets if no content between them
                    column_name = column_name.replace('[', '').replace(']', '')
            
            # Remove any characters that are not letters, numbers, or spaces
            sanitized = ''.join(c for c in column_name if c.isalnum() or c.isspace())
            
            # Replace multiple spaces with single space
            sanitized = ' '.join(sanitized.split())
            
            # Replace spaces with underscores
            sanitized = sanitized.replace(' ', '_')
            
            # Ensure the name starts with a letter
            if sanitized and not sanitized[0].isalpha():
                sanitized = 'C_' + sanitized
            
            # Ensure the name is not empty
            if not sanitized:
                sanitized = 'Column'
                
            # Ensure the name is not too long (Excel has a limit)
            if len(sanitized) > 31:
                sanitized = sanitized[:31]
                
            return sanitized
            
        except Exception as e:
            logger.error(f"Error sanitizing column name '{column_name}': {str(e)}")
            return "Column"  # Return a safe default value

    def generate_excel(self, template_id: str) -> Dict[str, str]:
        """Generate Excel file with all metadata for a specific template."""
        try:
            # Create output directory if it doesn't exist
            os.makedirs(self.output_dir, exist_ok=True)
            
            # Get template-specific Excel path
            excel_path = self._get_excel_path(template_id)
            
            # Get template fields from template context
            from context.template_context import TemplateContext
            template_context = TemplateContext()
            template = template_context.get_template(template_id)
            if not template:
                logger.error(f"No template found for template ID: {template_id}")
                raise ValueError(f"No template found for template ID: {template_id}")
            
            template_fields = template.get('metadataFields', [])
            if not template_fields:
                logger.error(f"No template fields found for template ID: {template_id}")
                raise ValueError(f"No template fields found for template ID: {template_id}")
            
            # Filter metadata for this template
            template_metadata = [doc for doc in self.metadata_list if doc.get('Template ID') == template_id]
            
            # Create DataFrame with only template fields
            df_data = []
            for doc in template_metadata:
                row = {}
                for field in template_fields:
                    field_name = field.get('name')
                    row[field_name] = doc.get(field_name, "Not found")
                # Add required fields
                row['File Name'] = doc.get('File Name', '')
                row['Template ID'] = doc.get('Template ID', '')
                df_data.append(row)
            
            # Create DataFrame
            df = pd.DataFrame(df_data)
            
            # Sanitize column names
            df.columns = [self._sanitize_column_name(col) for col in df.columns]
            
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
            
            # Upload Excel file to SharePoint and get URL
            sharepoint_url = None
            try:
                from services.sharepoint_service import SharePointService
                sharepoint_service = SharePointService()
                
                # Get the folder path from the first document's URL
                doc_url = None
                if template_metadata and 'Document URL' in template_metadata[0]:
                    doc_url = template_metadata[0]['Document URL']
                elif template_metadata and 'webUrl' in template_metadata[0]:
                    doc_url = template_metadata[0]['webUrl']
                else:
                    for doc in template_metadata:
                        for key in doc:
                            if isinstance(doc[key], str) and 'graph.microsoft.com' in doc[key]:
                                doc_url = doc[key]
                                break
                        if doc_url:
                            break
                if doc_url:
                    logger.info(f"Processing document URL: {doc_url}")
                    if 'graph.microsoft.com' in doc_url:
                        if '/drive/root:/' in doc_url:
                            try:
                                full_path = doc_url.split('/drive/root:/')[1]
                                folder_path = full_path.split(':/')[0]
                                folder_path = folder_path.rstrip('/')
                                if '%20' in folder_path:
                                    folder_path = folder_path.replace('%20', ' ')
                                if not folder_path:
                                    raise ValueError("Empty folder path extracted from URL")
                                logger.info(f"Final SharePoint folder path: {folder_path}")
                                with open(excel_path, 'rb') as file:
                                    file_content = file.read()
                                    file_name = os.path.basename(excel_path)
                                    if not file_content:
                                        logger.error("Excel file content is empty")
                                    else:
                                        logger.info(f"File size: {len(file_content)} bytes")
                                        logger.info(f"Attempting to upload Excel file to SharePoint folder: {folder_path}")
                                        try:
                                            sharepoint_url = sharepoint_service.upload_file(file_content, file_name, folder_path)
                                            if sharepoint_url:
                                                logger.info(f"Excel file uploaded successfully to SharePoint: {sharepoint_url}")
                                            else:
                                                logger.error("Failed to get SharePoint URL after upload")
                                        except Exception as upload_error:
                                            logger.error(f"Error during SharePoint upload: {str(upload_error)}")
                                            logger.error(f"Upload URL: {doc_url}")
                                            logger.error(f"Target folder: {folder_path}")
                                            logger.error(f"File name: {file_name}")
                                            logger.error(f"File size: {len(file_content)} bytes")
                            except Exception as path_error:
                                logger.error(f"Error extracting folder path from URL: {str(path_error)}")
                                logger.error(f"Original URL: {doc_url}")
                    else:
                        logger.error("Invalid URL format - not a Graph API URL")
                else:
                    logger.error("No document URL found in template metadata")
            except Exception as e:
                logger.error(f"Error uploading Excel to SharePoint: {str(e)}")
                # Continue even if upload fails
            
            return {
                'local_path': excel_path,
                'sharepoint_url': sharepoint_url
            }
            
        except Exception as e:
            logger.error(f"Error generating Excel file: {str(e)}")
            raise

    def get_current_excel_path(self, template_id: str) -> str:
        return self._get_excel_path(template_id)

    # def clear_data(self, template_id: str = None) -> None:
    #     if template_id:
    #         # Clear data for specific template
    #         self.metadata_list = [doc for doc in self.metadata_list if doc.get('Template ID') != template_id]
    #         self.document_urls = [url for url in self.document_urls if url not in [doc.get('File Name') for doc in self.metadata_list if doc.get('Template ID') == template_id]]
    #         excel_path = self._get_excel_path(template_id)
    #         if os.path.exists(excel_path):
    #             os.remove(excel_path)
    #     else:
    #         # Clear all data
    #         self.metadata_list = []
    #         self.document_urls = []
    #         for excel_path in self.template_excel_files.values():
    #             if os.path.exists(excel_path):
    #                 os.remove(excel_path)
    #         self.template_excel_files = {}
    #     self.metadata_storage._save_metadata()
    #     logger.info("Cleared stored data")

    # def delete_metadata(self, document_url: str, template_id: str) -> str:
    #     """
    #     Delete metadata for a specific document from the Excel file.
        
    #     Args:
    #         document_url (str): URL of the document to delete
    #         template_id (str): ID of the template
            
    #     Returns:
    #         str: Path to the updated Excel file
    #     """
    #     try:
    #         # Extract file name from URL
    #         if 'sharepoint.com' in document_url.lower():
    #             try:
    #                 file_name = document_url.split('Documents/')[-1]
    #                 file_name = file_name.replace('%20', ' ')
    #             except:
    #                 file_name = os.path.basename(document_url)
    #         else:
    #             file_name = os.path.basename(document_url)
            
    #         # Remove from metadata list and document URLs
    #         self.metadata_list = [doc for doc in self.metadata_list if doc.get('File Name') != file_name]
    #         self.document_urls = [url for url in self.document_urls if url != file_name]
            
    #         # If no metadata left for this template, remove the Excel file
    #         template_metadata = [doc for doc in self.metadata_list if doc.get('Template ID') == template_id]
    #         if not template_metadata:
    #             excel_path = self._get_excel_path(template_id)
    #             if os.path.exists(excel_path):
    #                 os.remove(excel_path)
    #             return excel_path
            
    #         # Generate updated Excel file with remaining metadata
    #         return self.generate_excel(template_id)
            
    #     except Exception as e:
    #         logger.error(f"Error deleting metadata: {str(e)}")
    #         raise
