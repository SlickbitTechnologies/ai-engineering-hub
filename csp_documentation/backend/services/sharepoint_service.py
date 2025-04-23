import os
import logging
import requests
from dotenv import load_dotenv
from typing import Optional, List, Dict
from office365.runtime.auth.client_credential import ClientCredential
from office365.sharepoint.client_context import ClientContext
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class SharePointService:
    def __init__(self):
        self.client_id = os.getenv('SHAREPOINT_CLIENT_ID')
        self.client_secret = os.getenv('SHAREPOINT_CLIENT_SECRET')
        self.tenant_id = os.getenv('SHAREPOINT_TENANT_ID')
        self.site_url = os.getenv('SHAREPOINT_SITE_URL')
        self.folder_path = os.getenv('SHAREPOINT_FOLDER_PATH')
        self.client = None
        self.access_token = None
        self.token_expiry = 0

        # Ensure site URL has protocol
        if self.site_url and not self.site_url.startswith('http'):
            self.site_url = f'https://{self.site_url}'

        # Handle OneDrive folder path (if applicable)
        if self.folder_path and 'onedrive.aspx' in self.folder_path:
            try:
                path_start = self.folder_path.find('id=') + 3
                path_end = self.folder_path.find('&', path_start)
                if path_end == -1:
                    path_end = len(self.folder_path)
                encoded_path = self.folder_path[path_start:path_end]
                self.folder_path = requests.utils.unquote(encoded_path)
            except Exception as e:
                logger.error(f"Error parsing SharePoint folder path: {str(e)}")
                self.folder_path = None

        # Validate required configuration
        if not all([self.client_id, self.client_secret, self.tenant_id, self.site_url, self.folder_path]):
            raise ValueError("Missing required SharePoint configuration in environment variables")

    def _initialize_client(self):
        """Initialize SharePoint client."""
        if not self.client:
            try:
                credentials = ClientCredential(self.client_id, self.client_secret)
                self.client = ClientContext(self.site_url).with_credentials(credentials)
                logger.info("SharePoint client initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing SharePoint client: {str(e)}")
                raise

    def _get_access_token(self) -> str:
        """
        Get Microsoft Graph API access token using client credentials flow.
        
        Returns:
            str: Access token
        """
        try:
            # Check if we have a valid token
            if self.access_token and time.time() < self.token_expiry:
                return self.access_token

            # Get new token
            token_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/token"
            data = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'grant_type': 'client_credentials',
                'resource': 'https://graph.microsoft.com/'
            }
            
            response = requests.post(token_url, data=data)
            response.raise_for_status()
            token_data = response.json()
            
            # Store token and expiry
            self.access_token = token_data['access_token']
            self.token_expiry = time.time() + int(token_data['expires_in']) - 300  # 5 min buffer
            
            return self.access_token
            
        except Exception as e:
            logger.error(f"Error getting access token: {str(e)}")
            raise

    def _get_site_id(self) -> str:
        """
        Get the site ID for the regulatory-docs site.
        
        Returns:
            str: Site ID
        """
        try:
            access_token = self._get_access_token()
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            # Search for the site
            search_url = "https://graph.microsoft.com/v1.0/sites?search=regulatory-docs"
            response = requests.get(search_url, headers=headers)
            response.raise_for_status()
            
            sites = response.json().get('value', [])
            if not sites:
                raise ValueError("Site not found")
                
            # Get the site ID
            site_id = sites[0]['id']
            logger.info(f"Found site ID: {site_id}")
            return site_id
            
        except Exception as e:
            logger.error(f"Error getting site ID: {str(e)}")
            raise

    def get_files(self, folder_path: Optional[str] = None) -> List[Dict]:
        """
        Get all PDF files from a SharePoint folder.
        
        Args:
            folder_path (str, optional): Custom folder path. Defaults to "Regulatory IDMP Documents".
            
        Returns:
            List[Dict]: List of dictionaries with file metadata.
        """
        try:
            access_token = self._get_access_token()
            site_id = self._get_site_id()
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            # Get files from the specified folder
            folder_path = folder_path or "Regulatory IDMP Documents"
            files_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/{folder_path}:/children"
            
            response = requests.get(files_url, headers=headers)
            response.raise_for_status()
            
            files = response.json().get('value', [])
            return [
                {
                    'url': f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/items/{file['id']}/content",
                    'name': file['name'],
                    'size': file.get('size', 0),
                    'last_modified': file.get('lastModifiedDateTime')
                }
                for file in files if file['name'].lower().endswith('.pdf')
            ]
            
        except Exception as e:
            logger.error(f"Error getting SharePoint files: {str(e)}")
            raise

    def download_file(self, file_url: str, local_path: Optional[str] = None) -> str:
        """
        Download a file from SharePoint.
        
        Args:
            file_url (str): URL of the file.
            local_path (str, optional): Local path to save the file.
            
        Returns:
            str: Path to downloaded file.
        """
        try:
            access_token = self._get_access_token()
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/octet-stream'
            }
            
            if not local_path:
                local_path = os.path.join('temp', os.path.basename(file_url))
                os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            response = requests.get(file_url, headers=headers, stream=True)
            response.raise_for_status()
            
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"File downloaded successfully: {local_path}")
            return local_path
            
        except Exception as e:
            logger.error(f"Error downloading SharePoint file: {str(e)}")
            raise

    def _convert_to_direct_url(self, sharing_url: str) -> str:
        """
        Convert SharePoint sharing URL to direct download URL.

        Args:
            sharing_url (str): SharePoint sharing URL

        Returns:
            str: Direct download URL
        """
        try:
            if 'onedrive.aspx' in sharing_url:
                parts = sharing_url.split('id=')
                if len(parts) > 1:
                    file_path = requests.utils.unquote(parts[1].split('&')[0])
                    site_url = sharing_url.split('/_layouts/')[0]
                    return f"{site_url}/_api/web/GetFileByServerRelativeUrl('{file_path}')/$value"

            elif 'sharepoint.com' in sharing_url:
                site_url = sharing_url.split('/_layouts/')[0]
                file_path = requests.utils.unquote(sharing_url.split('id=')[1].split('&')[0])
                return f"{site_url}/_api/web/GetFileByServerRelativeUrl('{file_path}')/$value"

            return sharing_url
        except Exception as e:
            logger.error(f"Error converting URL: {str(e)}")
            raise

    async def download_folder_contents(self, folder_path: str, local_path: str) -> List[str]:
        """Download all contents of a SharePoint folder recursively"""
        try:
            # Ensure local directory exists
            os.makedirs(local_path, exist_ok=True)
            
            # Get folder contents
            folder = self.client.web.get_folder_by_server_relative_url(folder_path)
            items = folder.files
            
            downloaded_files = []
            
            for item in items:
                if item.is_folder:
                    # Recursively download subfolder
                    subfolder_path = os.path.join(local_path, item.name)
                    subfolder_files = await self.download_folder_contents(
                        f"{folder_path}/{item.name}",
                        subfolder_path
                    )
                    downloaded_files.extend(subfolder_files)
                else:
                    # Download file
                    file_path = os.path.join(local_path, item.name)
                    with open(file_path, 'wb') as f:
                        item.download(f).execute_query()
                    downloaded_files.append(file_path)
                    logger.info(f"Downloaded file: {file_path}")
            
            return downloaded_files
            
        except Exception as e:
            logger.error(f"Error downloading folder contents: {str(e)}")
            raise

    async def process_folder_documents(self, folder_path: str, local_path: str) -> List[Dict]:
        """Process all documents in a folder and its subfolders"""
        try:
            # Download all files
            downloaded_files = await self.download_folder_contents(folder_path, local_path)
            
            all_metadata = []
            
            # Process each file
            for file_path in downloaded_files:
                try:
                    # Check if file is a document (PDF, DOCX, etc.)
                    if file_path.lower().endswith(('.pdf', '.docx', '.doc')):
                        # Extract metadata from the document
                        metadata = await self.extract_metadata_from_document(file_path)
                        if metadata:
                            all_metadata.append(metadata)
                            logger.info(f"Processed document: {file_path}")
                except Exception as e:
                    logger.error(f"Error processing file {file_path}: {str(e)}")
                    continue
            
            return all_metadata
            
        except Exception as e:
            logger.error(f"Error processing folder documents: {str(e)}")
            raise
