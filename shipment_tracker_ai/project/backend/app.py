from flask import Flask, request, jsonify
import os
import json
from flask_cors import CORS
import logging
from datetime import datetime, timedelta
import uuid
import random
import time
from sample_data import generate_sample_data
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather

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

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    shipments = generate_sample_data()
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

# Twilio configuration - would be in environment variables in production
TWILIO_ACCOUNT_SID = 'Your_key'  # Set to your actual Twilio account SID in production
TWILIO_AUTH_TOKEN = 'Your_key'    # Set to your actual Twilio auth token in production
TWILIO_PHONE_NUMBER = '+15551234567'     # Set to your actual Twilio phone number in production

# Initialize Twilio client
try:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    logger.info("Twilio client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Twilio client: {e}")
    twilio_client = None

# Twilio voice call API endpoint
@app.route('/api/twilio/call', methods=['POST'])
def make_call():
    try:
        data = request.json
        to_number = data.get('to')
        from_number = data.get('from', TWILIO_PHONE_NUMBER)
        message = data.get('message', 'Alert from Cold Chain Monitor.')
        
        if not to_number:
            return jsonify({"error": "Recipient phone number is required"}), 400
        
        # Log the call details
        logger.info(f"Making call to: {to_number}, message: {message}")
        
        # Check if Twilio client is initialized
        if twilio_client is None:
            # If Twilio is not configured, return a mock response
            call_sid = f"CA{uuid.uuid4().hex[:32]}"
            logger.warning("Twilio client not initialized. Returning mock response.")
            return jsonify({
                "success": True,
                "call_sid": call_sid,
                "status": "queued",
                "mock": True
            })
            
        # Use the Twilio SDK to make the call
        call = twilio_client.calls.create(
            to=to_number,
            from_=from_number,
            url=request.url_root + f"api/twilio/twiml?message={message}"  # URL to TwiML
        )
        
        logger.info(f"Twilio call initiated: {call.sid}")
        
        return jsonify({
            "success": True,
            "call_sid": call.sid,
            "status": call.status
        })
    except Exception as e:
        logger.error(f"Error making Twilio call: {e}")
        return jsonify({"error": str(e)}), 500

# TwiML generation for the call
@app.route('/api/twilio/twiml', methods=['GET', 'POST'])
def twiml():
    # Generate TwiML to control the call
    message = request.args.get('message', 'Alert from Cold Chain Monitor. Temperature deviation detected in shipment.')
    
    response = VoiceResponse()
    response.say(message)
    response.pause(length=1)
    response.say("Press 1 to acknowledge this alert.")
    
    gather = Gather(num_digits=1, action="/api/twilio/handle-input", method="POST")
    response.append(gather)
    
    return str(response), 200, {'Content-Type': 'text/xml'}

# Handle input from the call
@app.route('/api/twilio/handle-input', methods=['POST'])
def handle_input():
    digits = request.form.get('Digits', '')
    response = VoiceResponse()
    
    if digits == '1':
        response.say("Alert acknowledged. Thank you.")
    else:
        response.say("Invalid input. Alert status remains active.")
    
    return str(response), 200, {'Content-Type': 'text/xml'}

@app.route('/api/twilio/calls', methods=['GET'])
def get_call_history():
    # Try to get actual call history from Twilio if client is initialized
    if twilio_client:
        try:
            # Get recent calls from Twilio
            twilio_calls = twilio_client.calls.list(limit=20)
            
            # Format the calls for the frontend
            call_history = [{
                "sid": call.sid,
                "to": call.to,
                "from": call.from_,
                "status": call.status,
                "duration": call.duration,
                "timestamp": call.start_time.isoformat() if call.start_time else datetime.now().isoformat(),
                "direction": call.direction
            } for call in twilio_calls]
            
            return jsonify(call_history)
        except Exception as e:
            logger.error(f"Error retrieving call history from Twilio: {e}")
    
    # Fall back to mock data if Twilio is not available or there's an error
    # Create some sample call history data
    call_history = [
        {
            "sid": f"CA{uuid.uuid4().hex[:32]}",
            "to": "+15551234567",
            "from": TWILIO_PHONE_NUMBER,
            "status": "completed",
            "duration": "45",
            "timestamp": (datetime.now() - timedelta(days=1)).isoformat(),
            "direction": "outbound-api"
        },
        {
            "sid": f"CA{uuid.uuid4().hex[:32]}",
            "to": "+15557654321",
            "from": TWILIO_PHONE_NUMBER,
            "status": "no-answer",
            "duration": "0",
            "timestamp": (datetime.now() - timedelta(days=3)).isoformat(),
            "direction": "outbound-api"
        }
    ]
    
    return jsonify(call_history)

if __name__ == '__main__':
    # Ensure data directory exists
    os.makedirs('backend/data', exist_ok=True)
    
    # Create some sample data if none exists
    if len(get_shipments()) == 0:
        from sample_data import create_sample_data
        create_sample_data()
        logger.info("Created sample data")
    
    app.run(debug=True, port=5000)