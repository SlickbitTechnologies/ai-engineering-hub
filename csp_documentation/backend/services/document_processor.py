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
import tiktoken
from datetime import datetime, timedelta
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time
from queue import Queue
import threading
from functools import partial
import tempfile
import uuid

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
        self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Initialize template context
        self.template_context = TemplateContext()

        self.sharepoint_client = None
        
        # Initialize token tracking
        self.token_tracking = {
            'total_tokens': 0,
            'tokens_per_minute': [],
            'last_minute_tokens': 0,
            'last_minute_time': datetime.now(),
            'documents_processed': 0,
            'documents_exceeding_limit': 0
        }
        
        # Initialize tokenizer
        self.tokenizer = tiktoken.get_encoding("cl100k_base") 
        
        # Token limits and batch settings
        self.MAX_TOKENS_PER_BATCH = 900000  # 0.9 million tokens per batch
        self.MAX_BATCH_SIZE = 10  # Maximum number of documents per batch
        self.BATCH_PROCESSING_TIMEOUT = 120  # 2 minutes timeout for batch processing
        
        # Initialize queues and thread pools
        self.document_queue = Queue()
        self.result_queue = Queue()
        
        # Thread pool for processing
        self.process_pool = ThreadPoolExecutor(max_workers=4)
        
        # Lock for thread-safe operations
        self.token_lock = threading.Lock()

    def _get_temp_file_path(self) -> str:
        """Generate a unique temporary file path."""
        temp_dir = tempfile.gettempdir()
        unique_id = str(uuid.uuid4())
        return os.path.join(temp_dir, f"temp_document_{unique_id}.pdf")

    def _count_tokens(self, text: str) -> int:
        """Count the number of tokens in a text string."""
        try:
            return len(self.tokenizer.encode(text))
        except Exception as e:
            logger.error(f"Error counting tokens: {str(e)}")
            return 0

    def _update_token_tracking(self, tokens: int):
        """Update token tracking statistics."""
        current_time = datetime.now()
        self.token_tracking['total_tokens'] += tokens
        self.token_tracking['last_minute_tokens'] += tokens
        
        # Check if a minute has passed
        if current_time - self.token_tracking['last_minute_time'] >= timedelta(minutes=1):
            # Record tokens per minute
            self.token_tracking['tokens_per_minute'].append({
                'timestamp': self.token_tracking['last_minute_time'],
                'tokens': self.token_tracking['last_minute_tokens']
            })
            
            # Check if we exceeded the limit
            if self.token_tracking['last_minute_tokens'] > self.MAX_TOKENS_PER_BATCH:
                self.token_tracking['documents_exceeding_limit'] += 1
                logger.warning(f"Token limit exceeded in the last minute: {self.token_tracking['last_minute_tokens']} tokens")
            
            # Reset for next minute
            self.token_tracking['last_minute_tokens'] = 0
            self.token_tracking['last_minute_time'] = current_time

    def get_token_statistics(self) -> Dict:
        """Get current token usage statistics."""
        return {
            'total_tokens': self.token_tracking['total_tokens'],
            'documents_processed': self.token_tracking['documents_processed'],
            'documents_exceeding_limit': self.token_tracking['documents_exceeding_limit'],
            'tokens_per_minute': self.token_tracking['tokens_per_minute'][-5:] if self.token_tracking['tokens_per_minute'] else []
        }

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

    async def process_documents(self, url: str, template_id: str) -> List[Dict]:
        """
        Process multiple documents in parallel using queues and thread pools.
        """
        try:
            url_type = self._get_url_type(url)
            all_metadata = []
            failed_documents = []
            
            if url_type == 'sharepoint':
                self._initialize_sharepoint(url)
                files = self._get_sharepoint_files(url)
                if not files:
                    raise ValueError("No files found in the SharePoint folder")
                
                logger.info(f"Found {len(files)} files to process")
                
                # Start parallel processing
                start_time = time.time()
                
                # Start worker threads
                workers = []
                for _ in range(4):  # 4 worker threads
                    worker = threading.Thread(
                        target=self._process_document_worker,
                        args=(template_id,)
                    )
                    worker.start()
                    workers.append(worker)
                
                # Add documents to queue
                for file in files:
                    self.document_queue.put(file)
                
                # Add None to signal end of documents
                for _ in range(4):
                    self.document_queue.put(None)
                
                # Wait for all workers to complete
                for worker in workers:
                    worker.join()
                
                # Collect results
                while not self.result_queue.empty():
                    result = self.result_queue.get()
                    if isinstance(result, dict):
                        all_metadata.append(result)
                    else:
                        failed_documents.append(result)
                
                processing_time = time.time() - start_time
                logger.info(f"Processed {len(all_metadata)} documents in {processing_time:.2f} seconds")
                
            else:
                # Single document processing
                metadata = await self.process_document(url, template_id)
                all_metadata.append(metadata)
            
            return all_metadata
            
        except Exception as e:
            logger.error(f"Error processing documents: {str(e)}")
            raise

    def _process_document_worker(self, template_id: str):
        """
        Worker thread for processing documents from the queue.
        """
        while True:
            file = self.document_queue.get()
            if file is None:
                break
                
            temp_file_path = None
            try:
                # Generate unique temp file path
                temp_file_path = self._get_temp_file_path()
                
                # Download document
                self.download_document(file['url'], temp_file_path)
                
                # Extract text
                text = self.extract_text(temp_file_path)
                
                # Count tokens
                text_tokens = self._count_tokens(text)
                with self.token_lock:
                    self._update_token_tracking(text_tokens)
                
                # Generate prompt
                template = self.template_context.get_template(template_id)
                fields = template.get('metadataFields', [])
                prompt = self._generate_prompt(text, fields)
                
                # Count prompt tokens
                prompt_tokens = self._count_tokens(prompt)
                with self.token_lock:
                    self._update_token_tracking(prompt_tokens)
                
                # Get metadata from Gemini
                response = self.gemini_model.generate_content(prompt)
                
                # Count response tokens
                response_tokens = self._count_tokens(response.text)
                with self.token_lock:
                    self._update_token_tracking(response_tokens)
                
                # Parse response
                metadata = self._parse_response(response.text)
                
                # Add token statistics
                metadata['token_statistics'] = {
                    'text_tokens': text_tokens,
                    'prompt_tokens': prompt_tokens,
                    'response_tokens': response_tokens,
                    'total_tokens': text_tokens + prompt_tokens + response_tokens
                }
                
                # Update document count
                with self.token_lock:
                    self.token_tracking['documents_processed'] += 1
                
                # Add result to queue
                self.result_queue.put(metadata)
                
            except Exception as e:
                logger.error(f"Error processing document {file.get('name', 'unknown')}: {str(e)}")
                self.result_queue.put({
                    'error': str(e),
                    'file': file.get('name', 'unknown')
                })
            finally:
                # Clean up temporary file
                if temp_file_path and os.path.exists(temp_file_path):
                    try:
                        os.remove(temp_file_path)
                    except Exception as e:
                        logger.warning(f"Could not remove temporary file {temp_file_path}: {str(e)}")
                
                self.document_queue.task_done()

    def download_document(self, document_url: str, temp_file_path: str) -> None:
        """
        Download a document from various sources (PDF URL, SharePoint).
        
        Args:
            document_url (str): URL of the document
            temp_file_path (str): Path to save the downloaded document
        """
        try:
            if "sharepoint.com" in document_url:
                # Handle SharePoint URL
                if not self.sharepoint_service:
                    raise ValueError("SharePoint service not configured")
                self.sharepoint_service.download_file(document_url, temp_file_path)
            else:
                # Handle regular PDF URL
                response = requests.get(document_url, stream=True)
                response.raise_for_status()
                
                with open(temp_file_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
        except Exception as e:
            logger.error(f"Error downloading document: {str(e)}")
            raise

    def extract_text(self, file_path: str) -> str:
        """
        Extract text from a PDF file.
        """
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
                
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

    def get_files_to_process(self, url: str) -> list:
        """
        Return a list of files (dicts with 'name' and 'url') to process for a given SharePoint folder URL.
        """
        url_type = self._get_url_type(url)
        if url_type == 'sharepoint':
            self._initialize_sharepoint(url)
            files = self._get_sharepoint_files(url)
            return files
        else:
            # Single document
            return [{
                'name': os.path.basename(url),
                'url': url
            }] 