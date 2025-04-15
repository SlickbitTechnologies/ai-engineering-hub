import os
import json
import sys

def create_firebase_credentials():
    """
    Create a mock Firebase credentials file for development if it doesn't exist
    """
    creds_path = os.environ.get('FIREBASE_CREDENTIALS_PATH', './firebase-credentials.json')
    
    # Check if the file already exists
    if os.path.exists(creds_path):
        print(f"Firebase credentials file already exists at: {creds_path}")
        return
    
    # Create the directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath(creds_path)), exist_ok=True)
    
    # Create a mock credentials template
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
    
    # Write the mock credentials to the file
    with open(creds_path, 'w') as f:
        json.dump(mock_credentials, f, indent=2)
    
    print(f"Created mock Firebase credentials file at: {creds_path}")
    print("NOTE: These are mock credentials for development only.")
    print("For production, please replace with actual Firebase credentials.")

if __name__ == "__main__":
    create_firebase_credentials() 