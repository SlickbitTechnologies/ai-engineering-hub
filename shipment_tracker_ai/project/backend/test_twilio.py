import os
from twilio.rest import Client
import time
from dotenv import load_dotenv

# Load environment variables from .env file
print("Loading environment variables...")
load_dotenv()

# Get Twilio credentials
account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")

print(f"Account SID: {account_sid}")
print(f"Auth Token exists: {bool(auth_token)}")

# Initialize Twilio client
client = Client(account_sid, auth_token)

# Create the call
try:
    print("Initiating call...")
    call = client.calls.create(
        twiml="<Response><Say>This is a test call from your shipment tracker application.</Say></Response>",
        to="+918074928240",  # Your number
        from_="+13253087816"  # Make sure this is a Twilio number you've purchased
    )
    
    print(f"Call initiated! Call SID: {call.sid}")
    
    # Poll the call status until it ends
    print("Polling call status...")
    while True:
        call_details = client.calls(call.sid).fetch()
        print(f"Current status: {call_details.status}")
        
        if call_details.status in ["completed", "failed", "busy", "no-answer", "canceled"]:
            print(f"Call ended with status: {call_details.status}")
            if hasattr(call_details, 'duration'):
                print(f"Call duration: {call_details.duration} seconds")
            break
        time.sleep(5)
        
except Exception as e:
    print(f"Error making call: {str(e)}") 