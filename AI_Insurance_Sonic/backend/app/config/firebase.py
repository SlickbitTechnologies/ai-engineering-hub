import os
import json
import firebase_admin
from firebase_admin import credentials, storage
from ..core.config import settings

# Firebase configuration
firebase_config = {
    'credential_path': settings.FIREBASE_CREDENTIALS_PATH or './firebase-credentials.json',
    'storage_bucket': settings.FIREBASE_STORAGE_BUCKET or 'your-bucket-name.appspot.com',
    'mock_firebase': settings.MOCK_FIREBASE,
    'mock_storage_url': settings.MOCK_STORAGE_URL or 'https://example.com/storage'
}

# Firebase instance
firebase_app = None

def create_mock_credentials():
    """Create mock Firebase credentials for development if they don't exist"""
    creds_path = firebase_config['credential_path']
    
    # Check if credentials file already exists
    if os.path.exists(creds_path):
        return
    
    print(f"Creating mock Firebase credentials at: {creds_path}")
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath(creds_path)), exist_ok=True)
    
    # Mock credentials
    mock_credentials = {
        "type": "service_account",
        "project_id": "mock-project-id",
        "private_key_id": "mock-key-id",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk@mock-project-id.iam.gserviceaccount.com",
        "client_id": "mock-client-id",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40mock-project-id.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    }
    
    # Write mock credentials to file
    with open(creds_path, 'w') as f:
        json.dump(mock_credentials, f, indent=2)
    
    print("Mock Firebase credentials created successfully")
    print("WARNING: These are mock credentials for development only!")

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global firebase_app
    
    if firebase_app:
        return firebase_app
    
    try:
        # Create mock credentials for development if needed
        create_mock_credentials()
        
        cred = credentials.Certificate(firebase_config['credential_path'])
        firebase_app = firebase_admin.initialize_app(cred, {
            'storageBucket': firebase_config['storage_bucket']
        })
        print("Firebase initialized successfully")
        
        # Also print the bucket URL for debugging
        print(f"Firebase Storage bucket: {firebase_config['storage_bucket']}")
        
        return firebase_app
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        raise

def get_storage_bucket():
    """Get Firebase storage bucket"""
    try:
        # Ensure Firebase is initialized
        if not firebase_app:
            initialize_firebase()
        return storage.bucket()
    except Exception as e:
        print(f"Error getting storage bucket: {e}")
        raise 