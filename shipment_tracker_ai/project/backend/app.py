from flask import Flask, request, jsonify
import os
import json
from flask_cors import CORS
import logging
from datetime import datetime, timedelta
import uuid
import random
import time
from sample_data import create_sample_data
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv()

# Log environment variables (without sensitive data)
logger.info("Environment variables loaded:")
logger.info(f"TWILIO_ACCOUNT_SID exists: {bool(os.getenv('TWILIO_ACCOUNT_SID'))}")
logger.info(f"TWILIO_AUTH_TOKEN exists: {bool(os.getenv('TWILIO_AUTH_TOKEN'))}")
logger.info(f"TWILIO_PHONE_NUMBER exists: {bool(os.getenv('TWILIO_PHONE_NUMBER'))}")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Add a root route for debugging
@app.route('/')
def root():
    return jsonify({
        "message": "Cold Chain Monitor API is running",
        "endpoints": [
            "/api/shipments",
            "/api/shipments/<shipment_id>",
            "/api/users/login",
            "/api/users/register"
        ],
        "status": "OK"
    })

# Get absolute base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Mock data storage (in a real app, we'd use a database)
SHIPMENTS_FILE = os.path.join(BASE_DIR, "data", "shipments.json")
USERS_FILE = os.path.join(BASE_DIR, "data", "users.json")

# Ensure data directory exists
os.makedirs(os.path.dirname(SHIPMENTS_FILE), exist_ok=True)
os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)

# Initialize empty data files if they don't exist
if not os.path.exists(SHIPMENTS_FILE):
    shipments = create_sample_data()
    with open(SHIPMENTS_FILE, 'w') as f:
        json.dump(shipments, f)

if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'w') as f:
        json.dump([], f)

# Helper functions
def get_shipments():
    try:
        with open(SHIPMENTS_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.error(f"Error reading shipments file: {e}")
        return []

def save_shipments(shipments):
    try:
        with open(SHIPMENTS_FILE, 'w') as f:
            json.dump(shipments, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving shipments file: {e}")

def get_users():
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.error(f"Error reading users file: {e}")
        return []

def save_users(users):
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving users file: {e}")

# Routes
@app.route('/api/shipments', methods=['GET'])
def get_all_shipments():
    user_id = request.args.get('user_id')
    shipments = get_shipments()
    
    if user_id:
        # Filter shipments by user_id in a real app
        shipments = [s for s in shipments if s.get('user_id') == user_id]
    
    return jsonify(shipments)

@app.route('/api/shipments/<shipment_id>', methods=['GET'])
def get_shipment(shipment_id):
    shipments = get_shipments()
    shipment = next((s for s in shipments if s['id'] == shipment_id), None)
    
    if not shipment:
        return jsonify({"error": "Shipment not found"}), 404
    
    return jsonify(shipment)

@app.route('/api/shipments', methods=['POST'])
def create_shipment():
    if not request.json:
        return jsonify({"error": "Invalid request data"}), 400
    
    data = request.json
    shipments = get_shipments()
    
    # Generate a new ID
    new_id = str(len(shipments) + 1)
    data['id'] = new_id
    
    shipments.append(data)
    save_shipments(shipments)
    
    return jsonify(data), 201

@app.route('/api/shipments/<shipment_id>', methods=['PUT'])
def update_shipment(shipment_id):
    if not request.json:
        return jsonify({"error": "Invalid request data"}), 400
    
    data = request.json
    shipments = get_shipments()
    
    shipment = next((s for s in shipments if s['id'] == shipment_id), None)
    if not shipment:
        return jsonify({"error": "Shipment not found"}), 404
    
    # Update shipment data
    for key, value in data.items():
        shipment[key] = value
    
    save_shipments(shipments)
    
    return jsonify(shipment)

@app.route('/api/shipments/<shipment_id>/alerts', methods=['POST'])
def add_alert(shipment_id):
    if not request.json:
        return jsonify({"error": "Invalid request data"}), 400
    
    data = request.json
    shipments = get_shipments()
    
    shipment = next((s for s in shipments if s['id'] == shipment_id), None)
    if not shipment:
        return jsonify({"error": "Shipment not found"}), 404
    
    # Add the new alert
    if 'alerts' not in shipment:
        shipment['alerts'] = []
    
    alert_id = f"alert-{len(shipment['alerts']) + 1}"
    alert = {
        "id": alert_id,
        "type": data.get("type", "info"),
        "message": data.get("message", ""),
        "timestamp": data.get("timestamp", datetime.now().isoformat()),
        "location": data.get("location", ""),
        "read": False
    }
    
    shipment['alerts'].append(alert)
    save_shipments(shipments)
    
    return jsonify(alert), 201

@app.route('/api/shipments/<shipment_id>/temperature', methods=['POST'])
def add_temperature(shipment_id):
    if not request.json:
        return jsonify({"error": "Invalid request data"}), 400
    
    data = request.json
    shipments = get_shipments()
    
    shipment = next((s for s in shipments if s['id'] == shipment_id), None)
    if not shipment:
        return jsonify({"error": "Shipment not found"}), 404
    
    # Add the new temperature reading
    if 'temperatureHistory' not in shipment:
        shipment['temperatureHistory'] = []
    
    temperature = {
        "timestamp": data.get("timestamp", datetime.now().isoformat()),
        "value": data.get("value", 0)
    }
    
    shipment['temperatureHistory'].append(temperature)
    shipment['currentTemperature'] = data.get("value", 0)
    
    # Check if temperature is out of safe range and add alert if needed
    min_temp = 2  # Minimum safe temperature
    max_temp = 8  # Maximum safe temperature
    current_temp = data.get("value", 0)
    
    if current_temp < min_temp or current_temp > max_temp:
        if 'alerts' not in shipment:
            shipment['alerts'] = []
        
        alert_id = f"alert-{len(shipment['alerts']) + 1}"
        alert = {
            "id": alert_id,
            "type": "critical",
            "message": f"Temperature {'below' if current_temp < min_temp else 'exceeds'} {'minimum' if current_temp < min_temp else 'maximum'} threshold: {current_temp}°C",
            "timestamp": datetime.now().isoformat(),
            "location": data.get("location", ""),
            "read": False
        }
        
        shipment['alerts'].append(alert)
    
    save_shipments(shipments)
    
    return jsonify(temperature), 201

@app.route('/api/shipments/upload', methods=['POST'])
def upload_shipment_log():
    # This would process CSV/Excel files in a real implementation
    # For demo, we'll just acknowledge receipt
    
    return jsonify({"message": "Shipment log received and processed successfully"}), 200

@app.route('/api/users/register', methods=['POST'])
def register():
    if not request.json:
        return jsonify({"error": "Invalid request data"}), 400
    
    data = request.json
    users = get_users()
    
    # Check if email already exists
    if any(u['email'] == data.get('email') for u in users):
        return jsonify({"error": "Email already registered"}), 400
    
    # Create new user
    user = {
        "id": str(len(users) + 1),
        "name": data.get('name', ''),
        "email": data.get('email', ''),
        "password": data.get('password', ''),  # In real app, hash this!
        "createdAt": datetime.now().isoformat()
    }
    
    users.append(user)
    save_users(users)
    
    # Remove password before returning
    user_response = {**user}
    del user_response['password']
    
    return jsonify(user_response), 201

@app.route('/api/users/login', methods=['POST'])
def login():
    if not request.json:
        return jsonify({"error": "Invalid request data"}), 400
    
    data = request.json
    users = get_users()
    
    # Find user by email
    user = next((u for u in users if u['email'] == data.get('email')), None)
    if not user or user['password'] != data.get('password'):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Remove password before returning
    user_response = {**user}
    del user_response['password']
    
    # In a real app, generate and return a token here
    # For demo, we'll just return success
    return jsonify({
        "user": user_response,
        "token": "demo-token"  # Fake token for demo
    })

@app.route('/api/shipments/<shipment_id>/alerts/<alert_id>/read', methods=['POST'])
def mark_alert_read(shipment_id, alert_id):
    shipments = get_shipments()
    shipment = next((s for s in shipments if s['id'] == shipment_id), None)
    
    if not shipment:
        return jsonify({"error": "Shipment not found"}), 404
    
    alert = next((a for a in shipment['alerts'] if a['id'] == alert_id), None)
    if not alert:
        return jsonify({"error": "Alert not found"}), 404
    
    alert['read'] = True
    save_shipments(shipments)
    
    return jsonify({"success": True})

# Initialize Twilio client if credentials are available
twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID')
twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN')
twilio_phone_number = os.getenv('TWILIO_PHONE_NUMBER')

# Log environment variables status
logger.info("Environment variables loaded:")
logger.info(f"TWILIO_ACCOUNT_SID exists: {bool(twilio_account_sid)}")
logger.info(f"TWILIO_AUTH_TOKEN exists: {bool(twilio_auth_token)}")
logger.info(f"TWILIO_PHONE_NUMBER exists: {bool(twilio_phone_number)}")

# Initialize Twilio client if credentials are available
if all([twilio_account_sid, twilio_auth_token, twilio_phone_number]):
    twilio_client = Client(twilio_account_sid, twilio_auth_token)
    logger.info("Twilio client initialized successfully")
else:
    twilio_client = None
    logger.warning("Twilio credentials not found in environment variables. Running in development mode.")

# In-memory storage for call history
call_history = []

def get_call_history():
    try:
        if os.path.exists('data/call_history.json'):
            with open('data/call_history.json', 'r') as f:
                return json.load(f)
        return []
    except Exception as e:
        logger.error(f"Error reading call history: {str(e)}")
        return []

def save_call_history(calls):
    try:
        os.makedirs('data', exist_ok=True)
        with open('data/call_history.json', 'w') as f:
            json.dump(calls, f)
    except Exception as e:
        logger.error(f"Error saving call history: {str(e)}")

@app.route('/api/calls', methods=['POST'])
def make_call():
    try:
        data = request.json
        logger.info(f"Call request data: {data}")
        
        if not data or 'to' not in data:
            logger.error("Missing 'to' field in call request")
            return jsonify({
                'success': False,
                'error': 'Phone number is required'
            }), 400

        # Format the phone number to ensure it has the country code
        raw_phone = data['to'].strip() if isinstance(data['to'], str) else str(data['to'])
        
        # Safer phone number formatting
        if not raw_phone.startswith('+'):
            # If number starts with 91, add + prefix
            if raw_phone.startswith('91'):
                phone_number = '+' + raw_phone
            # If number starts with 7, 8, or 9, add +91 prefix (for Indian numbers)
            elif len(raw_phone) > 0 and raw_phone[0] in ['7', '8', '9']:
                phone_number = '+91' + raw_phone
            else:
                phone_number = '+91' + raw_phone
        else:
            phone_number = raw_phone

        # Get shipment details from the request
        shipment_details = data.get('shipmentDetails', {})
        logger.info(f"Using shipment details: {shipment_details}")
        
        # Extract values with better error handling and explicit defaults
        try:
            detected_temp = shipment_details.get('detectedTemperature', 'N/A')
            # Strip the °C suffix if present
            if isinstance(detected_temp, str) and '°C' in detected_temp:
                detected_temp = detected_temp.replace('°C', '')
            
            time_date = shipment_details.get('timeDate', 'N/A')
            temp_range = shipment_details.get('temperatureRange', 'N/A')
            person_name = shipment_details.get('personName', 'there')
            shipment_number = shipment_details.get('shipmentNumber', 'N/A')
            
            logger.info(f"Parsed call details - temp: {detected_temp}, time: {time_date}, range: {temp_range}, shipment: {shipment_number}")
        except Exception as e:
            logger.error(f"Error parsing shipment details: {e}")
            detected_temp = 'N/A'
            time_date = 'N/A'
            temp_range = 'N/A'
            person_name = 'there'
            shipment_number = 'N/A'
        
        logger.info(f"Final call details - to: {phone_number}, temp: {detected_temp}, time: {time_date}, range: {temp_range}")

        # Construct the conversation flow
        conversation = f"""
        <Response>
            <Say>Hello {person_name}, this is a call regarding your shipment with the details {shipment_number}. I'm reaching out because we noticed a temperature spike that's a bit outside the recommended range.</Say>
            <Pause length="2"/>
            <Say>The temperature hit {detected_temp} degrees at around {time_date}. The recommended range is {temp_range}, so we just wanted to make sure you're aware and can check on it.</Say>
            <Pause length="2"/>
            <Say>Thank you for your attention to this matter.</Say>
        </Response>
        """

        # List of verified numbers for testing
        verified_numbers = [
            '+918074928240',  # Your number
            '+13253087816'    # Twilio number
        ]

        if twilio_client:
            try:
                # Check if the number is verified (for trial accounts)
                if phone_number not in verified_numbers:
                    # For unverified numbers, return a helpful error message
                    return jsonify({
                        'success': False,
                        'error': f'Phone number {phone_number} is not verified. Please use one of the verified numbers: {", ".join(verified_numbers)}',
                        'verified_numbers': verified_numbers,
                        'formatted_number': phone_number
                    }), 400

                # Get the base URL for status callbacks
                base_url = request.host_url.rstrip('/')
                
                # Make real call using Twilio with status callback
                call = twilio_client.calls.create(
                    to=phone_number,
                    from_='+13253087816',  # Use the working Twilio number that was successful in testing
                    twiml=conversation,
                    status_callback=f"{base_url}/api/twilio-status-callback",
                    status_callback_method='POST',
                    status_callback_event=['completed', 'answered', 'busy', 'no-answer', 'failed', 'canceled']
                )
                
                call_data = {
                    'id': call.sid,
                    'recipient': phone_number,
                    'timestamp': datetime.now().isoformat(),
                    'duration': 0,
                    'status': call.status,
                    'message': conversation,
                    'shipmentDetails': shipment_details,
                    'metadata': {
                        'detectedTemperature': detected_temp,
                        'timeDate': time_date,
                        'temperatureRange': temp_range,
                        'shipmentNumber': shipment_number
                    }
                }

                # Save to call history
                call_history = get_call_history()
                call_history.append(call_data)
                save_call_history(call_history)

                return jsonify({
                    'success': True,
                    'message': 'Call initiated successfully',
                    'call': call_data
                })

            except Exception as e:
                error_message = str(e)
                logger.error(f"Twilio call error: {error_message}")
                
                # Handle specific Twilio errors
                if "unverified" in error_message.lower():
                    return jsonify({
                        'success': False,
                        'error': f'Phone number {phone_number} needs to be verified in your Twilio account. Please use one of the verified numbers: {", ".join(verified_numbers)}',
                        'verified_numbers': verified_numbers,
                        'formatted_number': phone_number,
                        'help_url': 'https://www.twilio.com/console/phone-numbers/verified'
                    }), 400
                else:
                    return jsonify({
                        'success': False,
                        'error': error_message
                    }), 500
        else:
            # Development mode: simulate a successful call
            logger.info(f"Development mode: Simulating call to {phone_number}")
            call_data = {
                'id': f'dev_{datetime.now().timestamp()}',
                'recipient': phone_number,
                'timestamp': datetime.now().isoformat(),
                'duration': 30,
                'status': 'completed',
                'message': conversation,
                'shipmentDetails': shipment_details,
                'metadata': {
                    'detectedTemperature': detected_temp,
                    'timeDate': time_date,
                    'temperatureRange': temp_range,
                    'shipmentNumber': shipment_number
                }
            }

            # Save to call history
            call_history = get_call_history()
            call_history.append(call_data)
            save_call_history(call_history)

            return jsonify({
                'success': True,
                'message': 'Call simulated successfully (development mode)',
                'call': call_data
            })

    except Exception as e:
        logger.error(f"Error making call: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/calls', methods=['GET'])
def get_calls():
    try:
        calls = get_call_history()
        return jsonify({
            'success': True,
            'calls': calls
        })
    except Exception as e:
        logger.error(f"Error getting calls: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Add a new route for handling Twilio status callbacks
@app.route('/api/twilio-status-callback', methods=['POST'])
def twilio_status_callback():
    try:
        # Extract status info from Twilio's callback
        call_sid = request.form.get('CallSid')
        call_status = request.form.get('CallStatus')
        call_duration = request.form.get('CallDuration', '0')
        
        logger.info(f"Received status callback for call {call_sid}: {call_status}, duration: {call_duration}s")
        
        # Update call in history
        call_history = get_call_history()
        for call in call_history:
            if call.get('id') == call_sid:
                call['status'] = call_status
                call['duration'] = int(call_duration)
                break
        
        save_call_history(call_history)
        
        return '', 204  # Return empty response with status 204 (No Content)
    except Exception as e:
        logger.error(f"Error processing Twilio status callback: {str(e)}")
        return '', 500

# Add a new endpoint to poll and refresh call status for a specific call
@app.route('/api/calls/<call_sid>/status', methods=['GET'])
def get_call_status(call_sid):
    try:
        # Check if we have this call in our history first
        call_history = get_call_history()
        local_call = next((call for call in call_history if call.get('id') == call_sid), None)
        
        # If the call exists and we have Twilio client, get the latest status
        if local_call and twilio_client:
            try:
                # Fetch the latest call details from Twilio API
                call_details = twilio_client.calls(call_sid).fetch()
                
                # Update our local record
                local_call['status'] = call_details.status
                if hasattr(call_details, 'duration') and call_details.duration:
                    local_call['duration'] = int(call_details.duration)
                
                # Save the updated history
                save_call_history(call_history)
                
                return jsonify({
                    'success': True,
                    'call': local_call
                })
            except Exception as e:
                # If we can't reach Twilio, just return what we have
                logger.error(f"Error fetching call from Twilio: {str(e)}")
                return jsonify({
                    'success': True,
                    'call': local_call,
                    'note': 'Using cached call data - could not refresh from Twilio'
                })
        elif local_call:
            # If no Twilio client, just return what we have
            return jsonify({
                'success': True,
                'call': local_call
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Call with SID {call_sid} not found'
            }), 404
    except Exception as e:
        logger.error(f"Error getting call status: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Ensure data directory exists
    os.makedirs('backend/data', exist_ok=True)
    
    # Create some sample data if none exists
    if len(get_shipments()) == 0:
        create_sample_data()
        logger.info("Created sample data")
    
    app.run(debug=True, port=5000)