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
        if not data or 'to' not in data:
            return jsonify({
                'success': False,
                'error': 'Phone number is required'
            }), 400

        # Format the phone number to ensure it has the country code
        raw_phone = data['to'].strip()
        if not raw_phone.startswith('+'):
            # If number starts with 91, add + prefix
            if raw_phone.startswith('91'):
                phone_number = '+' + raw_phone
            # If number starts with 7, add +91 prefix
            elif raw_phone.startswith('7'):
                phone_number = '+91' + raw_phone
            else:
                phone_number = '+91' + raw_phone
        else:
            phone_number = raw_phone

        message = data.get('message', 'This is a test call from Shipment Tracker AI')

        # List of verified numbers for testing
        verified_numbers = [
            '+917993557149',  # Your number
            '+17859757862'   # Twilio number
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

                # Make real call using Twilio
                call = twilio_client.calls.create(
                    to=phone_number,
                    from_='+17859757862',  # Your Twilio number
                    twiml=f'<Response><Say>{message}</Say></Response>'
                )
                
                call_data = {
                    'id': call.sid,
                    'recipient': phone_number,
                    'timestamp': datetime.now().isoformat(),
                    'duration': 0,
                    'status': call.status,
                    'message': message
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
                'message': message
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

if __name__ == '__main__':
    # Ensure data directory exists
    os.makedirs('backend/data', exist_ok=True)
    
    # Create some sample data if none exists
    if len(get_shipments()) == 0:
        create_sample_data()
        logger.info("Created sample data")
    
    app.run(debug=True, port=5000)