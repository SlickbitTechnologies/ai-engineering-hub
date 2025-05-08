import os
from dotenv import load_dotenv
import json
from typing import List, Dict
import pandas as pd
import io
import time
from urllib.parse import unquote
from datetime import datetime
from office365.runtime.auth.client_credential import ClientCredential
from office365.sharepoint.client_context import ClientContext

# Load environment variables first
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import logging
from services.document_processor import DocumentProcessor
from services.excel_generator import ExcelGenerator
from services.metadata_storage import MetadataStorage
from services.sharepoint_service import SharePointService
import shutil
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define request models
class DocumentProcessRequest(BaseModel):
    document_url: str
    template_id: str
    headers: dict = None  # Make headers optional

# Template models
class TemplateField(BaseModel):
    name: str
    description: str

class Template(BaseModel):
    id: str
    name: str
    description: str
    metadataFields: List[TemplateField]

# Template storage path
TEMPLATES_DIR = "templates"
os.makedirs(TEMPLATES_DIR, exist_ok=True)

app = FastAPI(title="Document Processing API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize document processor
document_processor = DocumentProcessor()

# Initialize ExcelGenerator
excel_generator = ExcelGenerator(output_dir="output")

# Initialize metadata storage
metadata_storage = MetadataStorage()

@app.post("/templates")
async def create_template(template: Template):
    """
    Create a new template with a unique ID.
    If no ID is provided, generate one using timestamp.
    """
    try:
        # Ensure template ID exists
        if not template.id:
            template.id = str(int(time.time() * 1000))  # Generate timestamp-based ID
        
        # Check if template with this ID already exists
        template_path = os.path.join(TEMPLATES_DIR, f"{template.id}.json")
        if os.path.exists(template_path):
            raise HTTPException(
                status_code=400,
                detail=f"Template with ID {template.id} already exists"
            )
        
        # Save template as JSON file
        with open(template_path, "w") as f:
            json.dump(template.dict(), f, indent=2)
            
        logger.info(f"Created new template with ID: {template.id}")
        return {"message": "Template created successfully", "template": template}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/templates")
async def get_templates():
    """
    Get all templates with their IDs.
    """
    try:
        templates = []
        for filename in os.listdir(TEMPLATES_DIR):
            if filename.endswith(".json"):
                template_id = filename.replace(".json", "")
                with open(os.path.join(TEMPLATES_DIR, filename), "r") as f:
                    template_data = json.load(f)
                    templates.append({
                        "id": template_id,
                        "name": template_data.get("name", ""),
                        "description": template_data.get("description", ""),
                        "metadataFields": template_data.get("metadataFields", [])
                    })
        return templates
    except Exception as e:
        logger.error(f"Error getting templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/templates/{template_id}")
async def get_template(template_id: str):
    """
    Get a specific template by ID.
    """
    try:
        template_path = os.path.join(TEMPLATES_DIR, f"{template_id}.json")
        if not os.path.exists(template_path):
            raise HTTPException(status_code=404, detail=f"Template with ID {template_id} not found")
            
        with open(template_path, "r") as f:
            template_data = json.load(f)
            return {
                "id": template_id,
                "name": template_data.get("name", ""),
                "description": template_data.get("description", ""),
                "metadataFields": template_data.get("metadataFields", [])
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting template {template_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    try:
        template_path = os.path.join(TEMPLATES_DIR, f"{template_id}.json")
        if not os.path.exists(template_path):
            raise HTTPException(status_code=404, detail="Template not found")
        os.remove(template_path)
        return {"message": "Template deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-document")
async def process_document(document_url: str, template_id: str):
    """
    Process one or more documents and extract metadata.
    
    Args:
        document_url (str): URL of the document, Drive folder, or SharePoint folder
        template_id (str): ID of the template to use for processing
        
    Returns:
        dict: Response containing metadata and success message
    """
    try:
        logger.info(f"Processing document(s) with template ID: {template_id}")

        # Get the list of files to process (names and urls)
        files_to_process = document_processor.get_files_to_process(document_url)
        total_documents = len(files_to_process)
        current_document = files_to_process[0]['name'] if files_to_process else None

        # Process the document(s) asynchronously
        all_metadata = await document_processor.process_documents(document_url, template_id)
        
        # Add each document's metadata to Excel file and collect sharepoint_url
        sharepoint_url = None
        for metadata in all_metadata:
            result = excel_generator.add_metadata(metadata, document_url, template_id)
            if isinstance(result, dict) and result.get('sharepoint_url'):
                sharepoint_url = result['sharepoint_url']
        
        return {
            "status": "success",
            "metadata": all_metadata,
            "total_documents": total_documents,
            "current_document": current_document,
            "sharepoint_url": sharepoint_url,
            "message": f"Processed {len(all_metadata)} document(s) successfully. Use /download-excel to download the Excel file."
        }
    except Exception as e:
        logger.error(f"Error processing document(s): {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-excel")
async def generate_excel(request: Request):
    try:
        data = await request.json()
        metadata = data.get('metadata', {})
        document_url = data.get('document_url', '')
        template_id = data.get('template_id', '')
        
        if not template_id:
            raise HTTPException(status_code=400, detail="Template ID is required")
        
        # Handle both list and dict metadata
        if isinstance(metadata, list):
            # Convert list of metadata to dict
            metadata_dict = {}
            for item in metadata:
                if isinstance(item, dict):
                    metadata_dict.update(item)
            metadata = metadata_dict
        
        # Add metadata to Excel generator
        excel_generator.add_metadata(metadata, document_url, template_id)
        
        # Generate/update Excel file
        excel_path = excel_generator.generate_excel(template_id)
        
        return {"excel_path": excel_path}
    except Exception as e:
        logger.error(f"Error generating Excel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download-excel")
async def download_excel(template_id: str):
    try:
        excel_path = excel_generator.get_current_excel_path(template_id)
        if not excel_path or not os.path.exists(excel_path):
            raise HTTPException(status_code=404, detail="Excel file not found")
            
        return FileResponse(
            excel_path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=os.path.basename(excel_path)
        )
    except Exception as e:
        logger.error(f"Error downloading Excel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        dict: Health status
    """
    return {"status": "healthy"}

@app.post("/templates/upload-fields")
async def upload_template_fields(file: UploadFile = File(...)):
    """
    Upload a CSV or Excel file containing template fields and their descriptions.
    The file should have two columns: 'name' and 'description'.
    """
    try:
        logger.info(f"Received file upload request for: {file.filename}")
        
        # Read the file content
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="File is empty")
            
        logger.info(f"File size: {len(contents)} bytes")
        
        # Determine file type and read accordingly
        try:
            if file.filename.endswith('.csv'):
                logger.info("Processing CSV file")
                df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
            elif file.filename.endswith(('.xlsx', '.xls')):
                logger.info("Processing Excel file")
                df = pd.read_excel(io.BytesIO(contents))
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Unsupported file type. Please upload a CSV or Excel file."
                )
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Error reading file: {str(e)}"
            )
        
        # Log the columns found in the file
        logger.info(f"File columns: {df.columns.tolist()}")
        
        # Validate required columns
        required_columns = ['name', 'description']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns or len(df.columns) < 2:
            error_msg = (
                "The uploaded file must have exactly two columns named 'name' and 'description'. "
                f"Found columns: {df.columns.tolist()}"
            )
            logger.error(error_msg)
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
        
        # Convert to list of fields
        fields = []
        for index, row in df.iterrows():
            try:
                if pd.notna(row['name']) and pd.notna(row['description']):
                    fields.append({
                        'name': str(row['name']).strip(),
                        'description': str(row['description']).strip()
                    })
            except Exception as e:
                logger.warning(f"Error processing row {index}: {str(e)}")
                continue
        
        if not fields:
            error_msg = "No valid fields found in the file. Please ensure the file contains 'name' and 'description' columns with valid data."
            logger.error(error_msg)
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
        
        logger.info(f"Successfully processed {len(fields)} fields from {file.filename}")
        return {"fields": fields}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@app.get("/metadata")
async def get_metadata():
    """
    Get all metadata from metadata_storage.json.
    """
    try:
        metadata = metadata_storage.get_metadata()
        return metadata
    except Exception as e:
        logger.error(f"Error getting metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metadata/{document_url}")
async def get_metadata_by_url(document_url: str):
    """Get metadata for a specific document."""
    try:
        metadata = metadata_storage.get_metadata_by_url(document_url)
        if not metadata:
            raise HTTPException(status_code=404, detail="Metadata not found")
        return {"status": "success", "metadata": metadata}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/metadata/{document_url:path}")
async def delete_metadata(document_url: str, template_id: str):
    """
    Delete metadata for a specific document URL.
    """
    try:
        # Decode the URL properly
        document_url = unquote(document_url)
        
        # Delete from metadata storage
        metadata_storage.delete_metadata(document_url)
        
        # Delete from Excel file
        excel_generator.delete_metadata(document_url, template_id)
        
        return {"message": "Metadata deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-folder")
async def process_folder(folder_path: str):
    try:
        # Initialize services
        sharepoint_service = SharePointService()
        excel_generator = ExcelGenerator()
        
        # Create local folder for downloads
        local_path = os.path.join("downloads", os.path.basename(folder_path))
        os.makedirs(local_path, exist_ok=True)
        
        # Process all documents in the folder
        all_metadata = await sharepoint_service.process_folder_documents(folder_path, local_path)
        
        # Add metadata to Excel
        for metadata in all_metadata:
            excel_generator.add_metadata(metadata)
        
        # Generate Excel file
        excel_path = excel_generator.generate_excel()
        
        return {
            "status": "success",
            "message": f"Processed {len(all_metadata)} documents",
            "excel_path": excel_path
        }
        
    except Exception as e:
        logger.error(f"Error processing folder: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-local-folder")
async def process_local_folder(folder_path: str):
    try:
        # Initialize services
        sharepoint_service = SharePointService()
        excel_generator = ExcelGenerator()
        
        # Verify folder exists
        if not os.path.isdir(folder_path):
            raise HTTPException(status_code=400, detail="Folder path does not exist")
        
        # Process all documents in the local folder
        all_metadata = await sharepoint_service.process_local_folder(folder_path)
        
        # Add metadata to Excel
        for metadata in all_metadata:
            excel_generator.add_metadata(metadata)
        
        # Generate Excel file
        excel_path = excel_generator.generate_excel()
        
        return {
            "status": "success",
            "message": f"Processed {len(all_metadata)} documents from local folder",
            "excel_path": excel_path
        }
        
    except Exception as e:
        logger.error(f"Error processing local folder: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download-documents")
async def download_documents(
    folder_path: str = Query(..., description="SharePoint folder path (server-relative URL)")
):
    try:
        # Load environment variables
        load_dotenv()
        
        # Get SharePoint credentials from environment variables
        client_id = os.getenv("SHAREPOINT_CLIENT_ID")
        client_secret = os.getenv("SHAREPOINT_CLIENT_SECRET")
        tenant_id = os.getenv("SHAREPOINT_TENANT_ID")
        site_url = os.getenv("SHAREPOINT_SITE_URL")
        
        if not all([client_id, client_secret, tenant_id, site_url]):
            raise HTTPException(status_code=500, detail="Missing SharePoint credentials in environment variables")
        
        # Create output directory if it doesn't exist
        output_dir = "output"
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize SharePoint client
        client_credentials = ClientCredential(client_id, client_secret)
        ctx = ClientContext(site_url).with_credentials(client_credentials)
        
        # Get folder
        folder = ctx.web.get_folder_by_server_relative_url(folder_path)
        ctx.load(folder)
        ctx.execute_query()
        
        # Get files from folder
        files = folder.files
        ctx.load(files)
        ctx.execute_query()
        
        # Create DataFrame for metadata
        metadata_list = []
        
        # Download files and collect metadata
        for file in files:
            try:
                # Create local file path
                local_path = os.path.join(output_dir, file.properties["Name"])
                
                # Download file
                with open(local_path, 'wb') as f:
                    file.download(f).execute_query()
                
                # Collect metadata
                metadata = {
                    "File Name": file.properties["Name"],
                    "File Size": file.properties["Length"],
                    "Last Modified": file.properties["TimeLastModified"],
                    "Local Path": local_path,
                    "SharePoint Path": f"{folder_path}/{file.properties['Name']}"
                }
                metadata_list.append(metadata)
                
                logger.info(f"Downloaded and processed: {file.properties['Name']}")
                
            except Exception as e:
                logger.error(f"Error processing file {file.properties['Name']}: {str(e)}")
                continue
        
        # Create Excel file with metadata
        if metadata_list:
            df = pd.DataFrame(metadata_list)
            excel_path = os.path.join(output_dir, f"metadata_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")
            
            with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Metadata')
                
                # Format columns
                worksheet = writer.sheets['Metadata']
                for col in worksheet.columns:
                    max_length = 0
                    column = col[0].column_letter
                    for cell in col:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = (max_length + 2)
                    worksheet.column_dimensions[column].width = adjusted_width
            
            return {
                "status": "success",
                "message": f"Processed {len(metadata_list)} files",
                "excel_path": excel_path,
                "files_processed": len(metadata_list)
            }
        else:
            return {
                "status": "success",
                "message": "No files found in the specified folder",
                "files_processed": 0
            }
            
    except Exception as e:
        logger.error(f"Error in download_documents: {str(e)}")
        if "401" in str(e):
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid SharePoint credentials")
        elif "404" in str(e):
            raise HTTPException(status_code=404, detail="Folder not found")
        else:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-local-pdf")
async def process_local_pdf(file: UploadFile = File(...)):
    try:
        # Initialize services
        document_processor = DocumentProcessor()
        excel_generator = ExcelGenerator()
        
        # Check if file is PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Create temporary directory for uploaded file
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        
        try:
            # Save file temporarily
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Process the PDF
            try:
                # Extract text from PDF
                text = document_processor.extract_text_from_pdf(file_path)
                
                # Extract metadata
                metadata = document_processor.extract_metadata(text)
                
                if metadata:
                    # Add file information to metadata
                    metadata['File Name'] = file.filename
                    metadata['File Size'] = os.path.getsize(file_path)
                    metadata['Upload Time'] = datetime.now().isoformat()
                    
                    # Add to Excel
                    excel_generator.add_metadata(metadata)
                    
                    # Generate Excel file
                    excel_path = excel_generator.generate_excel()
                    
                    # Clean up temporary file
                    os.remove(file_path)
                    
                    return {
                        "status": "success",
                        "message": "PDF processed successfully",
                        "metadata": metadata,
                        "excel_path": excel_path
                    }
                else:
                    raise HTTPException(status_code=400, detail="No metadata could be extracted from the PDF")
                    
            except Exception as e:
                logger.error(f"Error processing PDF content: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
                
        finally:
            # Clean up temporary directory
            shutil.rmtree(temp_dir, ignore_errors=True)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in process_local_pdf: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-local-folder-pdfs")
async def process_local_folder_pdfs(folder_path: str):
    try:
        # Initialize services
        document_processor = DocumentProcessor()
        excel_generator = ExcelGenerator()
        
        # Verify folder exists
        if not os.path.isdir(folder_path):
            raise HTTPException(status_code=400, detail="Folder path does not exist")
        
        processed_files = []
        
        # Walk through all files in the folder
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                if file.lower().endswith('.pdf'):
                    try:
                        file_path = os.path.join(root, file)
                        
                        # Extract text from PDF
                        text = document_processor.extract_text_from_pdf(file_path)
                        
                        # Extract metadata
                        metadata = document_processor.extract_metadata(text)
                        
                        if metadata:
                            # Add file information to metadata
                            metadata['File Name'] = file
                            metadata['File Path'] = file_path
                            metadata['File Size'] = os.path.getsize(file_path)
                            metadata['Process Time'] = datetime.now().isoformat()
                            
                            # Add to Excel
                            excel_generator.add_metadata(metadata)
                            processed_files.append(file)
                            
                            logger.info(f"Processed PDF: {file}")
                            
                    except Exception as e:
                        logger.error(f"Error processing file {file}: {str(e)}")
                        continue
        
        if processed_files:
            # Generate Excel file
            excel_path = excel_generator.generate_excel()
            
            return {
                "status": "success",
                "message": f"Processed {len(processed_files)} PDF files",
                "processed_files": processed_files,
                "excel_path": excel_path
            }
        else:
            raise HTTPException(status_code=400, detail="No PDF files found in the specified folder")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in process_local_folder_pdfs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/token-statistics")
async def get_token_statistics():
    """
    Get token usage statistics for document processing.
    
    Returns:
        dict: Token usage statistics including total tokens, documents processed,
              documents exceeding limit, and tokens per minute
    """
    try:
        stats = document_processor.get_token_statistics()
        return {
            "status": "success",
            "statistics": stats
        }
    except Exception as e:
        logger.error(f"Error getting token statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 