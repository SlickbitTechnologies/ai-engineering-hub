import os
import requests
import json
from PyPDF2 import PdfReader
import google.generativeai as genai
import logging
from dotenv import load_dotenv
from services.sharepoint_service import SharePointService
from context.template_context import TemplateContext
from typing import List, Dict, Optional
import re
from urllib.parse import urlparse
from office365.runtime.auth.client_credential import ClientCredential
from office365.sharepoint.client_context import ClientContext
from office365.sharepoint.files.file import File

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        # Initialize services only if credentials are available
        try:
            self.sharepoint_service = SharePointService()
        except ValueError as e:
            logger.warning(f"SharePoint service not available: {str(e)}")
            self.sharepoint_service = None
        
        # Initialize Gemini client
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        genai.configure(api_key=gemini_api_key)
        self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Initialize template context
        self.template_context = TemplateContext()

        self.sharepoint_client = None

    def _initialize_sharepoint(self, site_url: str):
        """Initialize SharePoint client if not already initialized."""
        if not self.sharepoint_client:
            client_id = os.getenv('SHAREPOINT_CLIENT_ID')
            client_secret = os.getenv('SHAREPOINT_CLIENT_SECRET')
            credentials = ClientCredential(client_id, client_secret)
            self.sharepoint_client = ClientContext(site_url).with_credentials(credentials)
    
    def _get_sharepoint_files(self, folder_url: str) -> List[Dict]:
        """Get all PDF files from a SharePoint folder."""
        try:
            if not self.sharepoint_service:
                logger.warning("SharePoint service not configured. Please set up SharePoint credentials.")
                return []
                
            # Extract the folder path from the Graph API URL
            if 'graph.microsoft.com' in folder_url:
                try:
                    # Extract the folder path from the URL
                    # Example URL: https://graph.microsoft.com/v1.0/sites/.../drive/root:/Regulatory IDMP Documents
                    parts = folder_url.split('/drive/root:/')
                    if len(parts) > 1:
                        folder_path = parts[1]
                        # Remove any trailing parameters or slashes
                        folder_path = folder_path.split(':/')[0]  # Remove any :/children or similar
                        folder_path = folder_path.rstrip('/')
                        
                        logger.info(f"Extracted folder path: {folder_path}")
                        
                        # Use the SharePoint service to get files from the specific folder
                        files = self.sharepoint_service.get_files(folder_path)
                        
                        return [{
                            'url': file['url'],
                            'name': file['name']
                        } for file in files]
                    else:
                        logger.error("Invalid Graph API URL format")
                        return []
                        
                except Exception as e:
                    logger.error(f"Error parsing Graph API URL: {str(e)}")
                    return []
            else:
                logger.error("Invalid SharePoint URL format")
                return []
            
        except Exception as e:
            logger.error(f"Error getting SharePoint files: {str(e)}")
            return []
    
    def _get_url_type(self, url: str) -> str:
        """Determine the type of URL."""
        if 'sharepoint.com' in url:
            return 'sharepoint'
        else:
            return 'document'

    def download_document(self, document_url: str) -> str:
        """
        Download a document from various sources (PDF URL, SharePoint).
        
        Args:
            document_url (str): URL of the document
            
        Returns:
            str: Path to the downloaded document
        """
        try:
            # Create a temporary file
            temp_file = "temp_document.pdf"
            
            if "sharepoint.com" in document_url:
                # Handle SharePoint URL
                if not self.sharepoint_service:
                    raise ValueError("SharePoint service not configured")
                return self.sharepoint_service.download_file(document_url, temp_file)
                
            else:
                # Handle regular PDF URL
                response = requests.get(document_url, stream=True)
                response.raise_for_status()
                
                with open(temp_file, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                return temp_file
                
        except Exception as e:
            logger.error(f"Error downloading document: {str(e)}")
            raise

    def extract_text(self, file_path: str) -> str:
        """
        Extract text from a PDF file.
        
        Args:
            file_path (str): Path to the PDF file
            
        Returns:
            str: Extracted text
        """
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
                
            # Check if file is a PDF
            if not file_path.lower().endswith('.pdf'):
                raise ValueError("Only PDF files are supported")
                
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            
            if not text.strip():
                raise ValueError("No text could be extracted from the PDF")
                
            return text
        except Exception as e:
            logger.error(f"Failed to extract text from document: {str(e)}")
            raise

    async def process_documents(self, url: str, template_id: str) -> List[Dict]:
        """
        Process one or more documents based on the URL type.
        
        Args:
            url (str): URL of the document or SharePoint folder
            template_id (str): ID of the template to use for processing
            
        Returns:
            List[Dict]: List of metadata for all processed documents
        """
        try:
            url_type = self._get_url_type(url)
            all_metadata = []
            failed_documents = []
            
            if url_type == 'sharepoint':
                # Initialize SharePoint client
                self._initialize_sharepoint(url)
                
                # Get all files from the SharePoint folder
                files = self._get_sharepoint_files(url)
                if not files:
                    raise ValueError("No files found in the SharePoint folder")
                
                logger.info(f"Found {len(files)} files to process")
                
                # Process each document asynchronously
                total_files = len(files)
                processed_files = 0
                
                for file in files:
                    try:
                        logger.info(f"Processing file {processed_files + 1}/{total_files}: {file['name']}")
                        
                        # Process each document
                        metadata = await self.process_document(file['url'], template_id)
                        
                        # Add document URL to metadata
                        metadata['Document URL'] = file['url']
                        
                        # Add to list of all metadata
                        all_metadata.append(metadata)
                        
                        # Update progress
                        processed_files += 1
                        progress = (processed_files / total_files) * 100
                        logger.info(f"Progress: {progress:.2f}% ({processed_files}/{total_files} files processed)")
                        
                        # Log success
                        logger.info(f"Successfully processed document: {file['name']}")
                        
                    except Exception as e:
                        logger.error(f"Error processing SharePoint file {file['name']}: {str(e)}")
                        failed_documents.append({
                            'name': file['name'],
                            'url': file['url'],
                            'error': str(e)
                        })
                        continue
                        
            else:  # Single document
                try:
                    metadata = await self.process_document(url, template_id)
                    metadata['Document URL'] = url
                    all_metadata.append(metadata)
                    logger.info(f"Successfully processed document from URL: {url}")
                except Exception as e:
                    logger.error(f"Error processing document: {str(e)}")
                    failed_documents.append({
                        'name': os.path.basename(url),
                        'url': url,
                        'error': str(e)
                    })
            
            # Log summary of processing
            logger.info(f"Total documents processed: {len(all_metadata)}")
            if failed_documents:
                logger.warning(f"Failed to process {len(failed_documents)} documents:")
                for doc in failed_documents:
                    logger.warning(f"- {doc['name']}: {doc['error']}")
            
            return all_metadata
            
        except Exception as e:
            logger.error(f"Error processing documents: {str(e)}")
            raise

    async def process_document(self, document_url: str, template_id: str) -> dict:
        """
        Process a document and extract metadata using fields from the selected template.
        
        Args:
            document_url (str): URL of the document to process
            template_id (str): ID of the template to use
            
        Returns:
            dict: Extracted metadata with only the fields from the template
        """
        result = {}
        try:
            logger.info(f"Processing document from URL: {document_url}")
            
            # Get template and its fields
            template = self.template_context.get_template(template_id)
            if not template:
                raise ValueError(f"Template with ID {template_id} not found")
            
            # Get fields from the selected template
            fields = template.get('metadataFields', [])
            if not fields:
                raise ValueError(f"No metadata fields found in template {template_id}")
            
            logger.info(f"Using template fields: {[field['name'] for field in fields]}")
            
            # Initialize result with all fields set to "Not found"
            for field in fields:
                result[field['name']] = "Not found"
            
            # Download the document
            file_path = self.download_document(document_url)
            
            try:
                # Extract text asynchronously
                text = await self.extract_text_async(file_path)
                if not text.strip():
                    raise ValueError("No text could be extracted from the document")
                
                logger.info(f"Extracted text length: {len(text)} characters")
                
                # Generate prompt with the template fields
                prompt = self._generate_prompt(text, fields)
                
                # Get metadata from Gemini
                response = self.gemini_model.generate_content(prompt)
                
                # Parse the response
                metadata = self._parse_response(response.text)
                
                # Update result with extracted values
                for field in fields:
                    field_name = field['name']
                    if field_name in metadata:
                        result[field_name] = metadata[field_name]
                    else:
                        result[field_name] = "Not found"
                
                logger.info(f"Extracted metadata: {json.dumps(result, indent=2)}")
                return result
                
            finally:
                # Clean up the temporary file
                if os.path.exists(file_path):
                    os.remove(file_path)
                    
        except Exception as e:
            logger.error(f"Failed to process document: {str(e)}")
            raise ValueError(f"Failed to process document: {str(e)}")

    async def extract_text_async(self, file_path: str) -> str:
        """
        Extract text from a PDF file asynchronously.
        
        Args:
            file_path (str): Path to the PDF file
            
        Returns:
            str: Extracted text
        """
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
                
            # Check if file is a PDF
            if not file_path.lower().endswith('.pdf'):
                raise ValueError("Only PDF files are supported")
                
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PdfReader(file)
                total_pages = len(pdf_reader.pages)
                
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    # Extract text from current page
                    page_text = page.extract_text()
                    text += page_text + "\n"
                    
                    # Log progress every 10 pages
                    if page_num % 10 == 0 or page_num == total_pages:
                        progress = (page_num / total_pages) * 100
                        logger.info(f"Text extraction progress: {progress:.2f}% ({page_num}/{total_pages} pages processed)")
            
            if not text.strip():
                raise ValueError("No text could be extracted from the PDF")
                
            return text
        except Exception as e:
            logger.error(f"Failed to extract text from document: {str(e)}")
            raise

    def _generate_prompt(self, text: str, fields: List[Dict]) -> str:
        """
        Generate a prompt for the LLM to extract specific fields from the text.
        
        Args:
            text (str): The document text to analyze
            fields (List[Dict]): List of fields to extract from the template
            
        Returns:
            str: Formatted prompt for the LLM
        """
        # Create field descriptions for the prompt
        field_descriptions = "\n".join([
            f"- {field['name']}: {field['description']}"
            for field in fields
        ])

        # Create field-specific search instructions
        field_search_instructions = "\n".join([
            f"For '{field['name']}':\n" +
            f"1. Look for exact matches of '{field['name']}'\n" +
            f"2. Look for variations (e.g., '{field['name'].lower()}', '{field['name'].replace('/', ' or ')}')\n" +
            f"3. Look for related terms and synonyms\n" +
            f"4. Check nearby paragraphs and sections\n" +
            f"5. Extract ALL relevant information found"
            for field in fields
        ])

        prompt = f"""You are a metadata extractor. Your task is to thoroughly analyze the given text and extract ALL relevant information for each specified field.

IMPORTANT: You must extract ALL information that is present in the text. Do not mark fields as "Not found" unless you have thoroughly searched the entire document and are absolutely certain the information is not present.

FIELD-SPECIFIC SEARCH INSTRUCTIONS:
{field_search_instructions}

For each field, you must:
1. Search the ENTIRE text carefully, including:
   - Headers and footers
   - Tables and lists
   - Formatted sections
   - Unstructured text
   - Any location in the document
2. Look for variations of field names and related terms
3. Consider context and surrounding information
4. Extract the most specific and complete value found
5. If you find partial information, include it rather than marking as "Not found"
6. For dates, look for any date format
7. For names and organizations, look for full names, abbreviations, and variations
8. For IDs and numbers, look for any numeric identifiers or codes
9. If a field has multiple values, include all relevant values separated by semicolons
10. Look for information in tables, lists, and formatted sections
11. Consider information that might be spread across multiple locations
12. Look for information in both structured and unstructured parts

Fields to extract:
{field_descriptions}

Text to analyze:
{text}

Return the results in JSON format with the field names as keys and the extracted values as values.
Example format:
{{
  "Study Title": "Exact title from text",
  "Study Phase": "Phase value from text",
  "Study Type": "Type value from text",
  "Study Status": "Status value from text",
  "Start Date": "Date value from text",
  "Completion Date": "Date value from text",
  "Sponsor": "Sponsor name from text",
  "Principal Investigator": "Investigator name from text"
}}

CRITICAL INSTRUCTIONS:
1. You MUST extract ALL information that is present in the text
2. Do not mark fields as "Not found" unless you have thoroughly searched the entire document
3. For each field:
   - Look for exact matches
   - Look for variations and related terms
   - Check nearby paragraphs and sections
   - Extract ALL relevant information
4. Consider variations in how information might be presented
5. Extract partial information when available
6. Look for related terms and synonyms
7. Consider context and surrounding information
8. For dates, extract any date format you find
9. For names and organizations, include all variations you find
10. For IDs and numbers, capture all numeric identifiers
11. If you find multiple values, include them all
12. Only use "Not found" if you are absolutely certain the information is not present after thorough searching
13. For fields like "Pregnancy/Lactation":
    - Look for information about pregnancy
    - Look for information about lactation
    - Look for information about both
    - Check sections about patient eligibility
    - Check sections about study population
    - Extract ALL relevant information found
14. For all fields:
    - Look in ALL parts of the document
    - Consider variations in wording
    - Extract partial information
    - Include all relevant details
    - Only use "Not found" if absolutely certain
15. Additional search strategies:
    - Look for information in bullet points and lists
    - Check for information in parentheses or brackets
    - Look for information after colons or semicolons
    - Check for information in tables and formatted sections
    - Look for information in headers and subheaders
    - Check for information in footnotes or references
    - Look for information in appendices or supplementary sections
    - Check for information in any part of the document
16. When searching for information:
    - Read the entire document carefully
    - Look for information in any format
    - Consider all possible locations
    - Extract all relevant details
    - Include partial information
    - Never assume information is not present
    - Always double-check before marking as "Not found"
"""
        return prompt

    def _parse_response(self, response: str) -> dict:
        """Parse the Gemini response into a dictionary."""
        try:
            # Clean the response string
            response = response.strip()
            
            # Try to parse as JSON directly
            try:
                data = json.loads(response)
                if isinstance(data, dict):
                    return data
            except json.JSONDecodeError:
                pass
            
            # If direct JSON parsing fails, try to extract JSON from the response
            start_idx = response.find('{')
            end_idx = response.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = response[start_idx:end_idx + 1]
                try:
                    data = json.loads(json_str)
                    if isinstance(data, dict):
                        return data
                except json.JSONDecodeError:
                    pass
            
            # If still no valid JSON, try to parse manually
            metadata = {}
            lines = response.split('\n')
            for line in lines:
                line = line.strip()
                if ':' in line:
                    try:
                        key, value = line.split(':', 1)
                        key = key.strip().strip('"\'')
                        value = value.strip().strip('"\'')
                        if key and value:  # Only add non-empty key-value pairs
                            metadata[key] = value
                    except:
                        continue
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}")
            logger.error(f"Original response: {response}")
            return {}  # Return empty dict instead of raising error 