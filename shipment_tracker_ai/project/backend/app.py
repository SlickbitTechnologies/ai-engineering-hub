from flask import Flask, request, jsonify, Response, session
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
from pyngrok import ngrok

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
# logger.info(f"NGROK_AUTH_TOKEN exists: {bool(os.getenv('NGROK_AUTH_TOKEN'))}")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = os.urandom(24)  # Required for session

# Initialize ngrok
try:
    # Kill any existing ngrok processes
    try:
        import psutil
        for proc in psutil.process_iter(['name']):
            if proc.info['name'] and 'ngrok' in proc.info['name'].lower():
                proc.kill()
    except Exception as e:
        logger.warning(f"Could not kill existing ngrok processes: {e}")

    # Configure ngrok with auth token
    ngrok_auth_token = os.getenv('NGROK_AUTH_TOKEN')
    if ngrok_auth_token:
        ngrok.set_auth_token(ngrok_auth_token)
        logger.info("ngrok auth token configured successfully")
    else:
        logger.warning("NGROK_AUTH_TOKEN not found in environment variables")

    # Kill any existing tunnels
    try:
        ngrok.kill()
    except:
        pass

    # Open a ngrok tunnel to the HTTP server
    public_url = ngrok.connect(5000).public_url
    logger.info(f"ngrok tunnel established at: {public_url}")
except Exception as e:
    logger.error(f"Failed to establish ngrok tunnel: {e}")
    public_url = None

# Dummy store functions
def get_call_history():
    try:
        with open("call_history.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_call_history(data):
    with open("call_history.json", "w") as f:
        json.dump(data, f, indent=2)

@app.route("/voice", methods=["POST"])
def voice():
    """Initial voice prompt"""
    try:
        # Get call parameters
        call_sid = request.values.get('CallSid')
        shipment_number = request.values.get('shipment_number', 'N/A')
        date_time = request.values.get('date_time', 'N/A')
        detected_temp = request.values.get('detected_temp', 'N/A')
        min_temp = request.values.get('min_temp', '2')
        max_temp = request.values.get('max_temp', '8')
        origin_location = request.values.get('origin_location', 'N/A')
        delivery_location = request.values.get('delivery_location', 'N/A')

        # Initialize or get call context
        call_context = {
            'call_sid': call_sid,
            'shipment_number': shipment_number,
            'date_time': date_time,
            'detected_temp': detected_temp,
            'min_temp': min_temp,
            'max_temp': max_temp,
            'origin_location': origin_location,
            'delivery_location': delivery_location
        }

        # Save initial context
        call_history = get_call_history()
        
        # Check if call already exists
        existing_call = next((call for call in call_history if call.get('id') == call_sid), None)
        if existing_call:
            logger.info(f"Found existing call {call_sid}, updating context")
            existing_call['metadata'] = call_context
            existing_call['transcript'] = existing_call.get('transcript', [])
        else:
            logger.info(f"Creating new call record for {call_sid}")
            call_history.append({
                'id': call_sid,
                'timestamp': datetime.now().isoformat(),
                'status': 'in-progress',
                'transcript': [],
                'metadata': call_context
            })
        
        save_call_history(call_history)
        logger.info(f"Initialized call context for {call_sid}")

        response = VoiceResponse()
        gather = Gather(
            input="speech",
            action="/process_input?step=initial_question",
            method="POST",
            timeout=5,
            speech_timeout='auto',
            language='en-US'
        )
        gather.say("Hi, this is an automated shipment alert from Slickbit's AI Monitoring System.")
        gather.say("We've detected a temperature deviation in your incoming shipment.")
        response.append(gather)
        response.redirect("/voice")  # If no input
        return Response(str(response), mimetype="application/xml")

    except Exception as e:
        logger.error(f"Error in /voice: {str(e)}")
        response = VoiceResponse()
        response.say("We're experiencing technical difficulties. Please try again later.")
        response.hangup()
        return Response(str(response), mimetype="application/xml")

@app.route("/process_input", methods=["POST"])
def process_input():
    try:
        step = request.args.get("step", "initial")
        speech_result = request.values.get("SpeechResult", "").strip()
        call_sid = request.values.get('CallSid')

        logger.info(f"Processing input - Step: {step}, Speech: {speech_result}")

        # Get call history
        call_history = get_call_history()
        current_call = next((call for call in call_history if call.get('id') == call_sid), None)
        
        if not current_call:
            logger.error(f"Call {call_sid} not found in history")
            response = VoiceResponse()
            response.say("Error: Call session not found.")
            response.hangup()
            return Response(str(response), mimetype="application/xml")

        # Initialize transcript list if it doesn't exist
        if 'transcript' not in current_call:
            current_call['transcript'] = []

        # Update transcript
        if speech_result:
            transcript_entry = {
                'step': step,
                'speech': speech_result,
                'timestamp': datetime.now().isoformat()
            }
            current_call['transcript'].append(transcript_entry)
            save_call_history(call_history)
            logger.info(f"Added transcript entry: {transcript_entry}")

        response = VoiceResponse()
        speech_lower = speech_result.lower()

        # Keywords for different questions
        shipment_id_keywords = ['which shipment', 'tell me which shipment', 'what shipment', 'shipment id', 'shipment number']
        duration_keywords = ['how long', 'stayed above', 'stayed above the range', 'duration', 'time period']
        acknowledgment_keywords = ['got it', 'thanks', 'thank you', 'thanks for letting me know']
        shipment_details_keywords = ['share the shipment details', 'share shipment details', 'shipment details']
        brief_dip_keywords = ['brief dip', 'sustained', 'was it a brief dip', 'was it sustained']
        understood_keywords = ['understood', 'make a note', 'i\'ll make a note', 'i will make a note']

        # First conversation flow
        if any(keyword in speech_lower for keyword in shipment_id_keywords):
            logger.info("Asked about shipment ID")
            gather = Gather(
                input="speech",
                action="/process_input?step=shipment_question",
                method="POST",
                timeout=5,
                speech_timeout='auto',
                language='en-US'
            )
            gather.say(f"It's Shipment ID {current_call['metadata']['shipment_number']}, expected to arrive today at {current_call['metadata']['date_time']}.")
            gather.say(f"The temperature was recorded at {current_call['metadata']['detected_temp']}°C, above the acceptable range of {current_call['metadata']['min_temp']} to {current_call['metadata']['max_temp']}°C.")
            response.append(gather)
            logger.info("Sent shipment ID response")

        elif any(keyword in speech_lower for keyword in duration_keywords):
            logger.info("Asked about duration")
            gather = Gather(
                input="speech",
                action="/process_input?step=duration_question",
                method="POST",
                timeout=5,
                speech_timeout='auto',
                language='en-US'
            )
            gather.say(" The temperature remained elevated for about 15 minutes.")
            gather.say("We recommend checking the packaging and documenting any signs of spoilage or compromise.")
            response.append(gather)
            logger.info("Sent duration response")

        elif any(keyword in speech_lower for keyword in acknowledgment_keywords):
            logger.info("Information acknowledged")
            response.say("You're welcome. This was an automated alert to help ensure safe and timely handling.")
            response.say("Have a good day.")
            current_call['status'] = 'completed'
            current_call['completed_at'] = datetime.now().isoformat()
            save_call_history(call_history)
            response.hangup()

        # Second conversation flow
        elif any(keyword in speech_lower for keyword in shipment_details_keywords):
            logger.info("Asked about shipment details")
            gather = Gather(
                input="speech",
                action="/process_input?step=shipment_question",
                method="POST",
                timeout=5,
                speech_timeout='auto',
                language='en-US'
            )
            gather.say(f"The shipment is {current_call['metadata']['shipment_number']}, traveling from {current_call['metadata']['origin_location']} to {current_call['metadata']['delivery_location']}.")
            gather.say(f"At {current_call['metadata']['date_time']}, the temperature dropped to {current_call['metadata']['detected_temp']}°C, which is below the acceptable {current_call['metadata']['min_temp']} to {current_call['metadata']['max_temp']}°C range.")
            response.append(gather)
            logger.info("Sent shipment details response")

        elif any(keyword in speech_lower for keyword in brief_dip_keywords):
            logger.info("Asked about duration type")
            gather = Gather(
                input="speech",
                action="/process_input?step=duration_type_question",
                method="POST",
                timeout=5,
                speech_timeout='auto',
                language='en-US'
            )
            gather.say("The drop lasted approximately 15 minutes and has since stabilized.")
            gather.say("This alert is for your awareness to help ensure downstream quality checks.")
            response.append(gather)
            logger.info("Sent duration type response")

        elif any(keyword in speech_lower for keyword in understood_keywords):
            logger.info("Information acknowledged")
            response.say("Thank you. This concludes the alert. Have a good day.")
            current_call['status'] = 'completed'
            current_call['completed_at'] = datetime.now().isoformat()
            save_call_history(call_history)
            response.hangup()

        # If we don't understand the question
        else:
            logger.info("Waiting for question")
            gather = Gather(
                input="speech",
                action="/process_input?step=general_question",
                method="POST",
                timeout=5,
                speech_timeout='auto',
                language='en-US'
            )
            gather.say("I can provide information about the shipment ID, temperature deviation, and duration. Please ask your question.")
            response.append(gather)

        logger.info(f"Generated response: {str(response)}")
        return Response(str(response), mimetype="application/xml")

    except Exception as e:
        logger.error(f"Error in /process_input: {str(e)}")
        response = VoiceResponse()
        response.say("We're experiencing technical difficulties. Please try again later.")
        response.hangup()
        return Response(str(response), mimetype="application/xml")

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
        
        # Get shipment data from the shipments file
        shipments = get_shipments()
        shipment_number = shipment_details.get('shipmentNumber', 'N/A')
        
        # Find the shipment in our data
        shipment = next((s for s in shipments if s.get('number') == shipment_number), None)
        
        # Extract values with better error handling and explicit defaults
        try:
            detected_temp = shipment_details.get('detectedTemperature', 'N/A')
            # Strip the °C suffix if present
            if isinstance(detected_temp, str) and '°C' in detected_temp:
                detected_temp = detected_temp.replace('°C', '')
            
            time_date = shipment_details.get('timeDate', 'N/A')
            temp_range = shipment_details.get('temperatureRange', 'N/A')
            person_name = shipment_details.get('personName', 'there')
            
            # Get origin and destination from shipment data if available
            origin_location = shipment.get('origin', 'N/A') if shipment else 'N/A'
            delivery_location = shipment.get('destination', 'N/A') if shipment else 'N/A'
            
            # Parse temperature range
            min_temp = '2'  # Default minimum temperature
            max_temp = '8'  # Default maximum temperature
            if isinstance(temp_range, str) and '-' in temp_range:
                try:
                    min_temp, max_temp = temp_range.split('-')
                    min_temp = min_temp.strip().replace('°C', '')
                    max_temp = max_temp.strip().replace('°C', '')
                except:
                    pass
            
            logger.info(f"Parsed call details - temp: {detected_temp}, time: {time_date}, range: {temp_range}, shipment: {shipment_number}, origin: {origin_location}, delivery: {delivery_location}")
        except Exception as e:
            logger.error(f"Error parsing shipment details: {e}")
            detected_temp = 'N/A'
            time_date = 'N/A'
            min_temp = '2'
            max_temp = '8'
            person_name = 'there'
            shipment_number = 'N/A'
            origin_location = 'N/A'
            delivery_location = 'N/A'

        # List of verified numbers for testing
        verified_numbers = [
            '+919542757209',  # Your number
            "+916303142612",
            "+918885627274",
            "+919502960560",
            "+917261963896",
            '+16067071774'    # Twilio number
        ]

        if twilio_client:
            try:
                # Check if the number is verified (for trial accounts)
                if phone_number not in verified_numbers:
                    return jsonify({
                        'success': False,
                        'error': f'Phone number {phone_number} is not verified. Please use one of the verified numbers: {", ".join(verified_numbers)}',
                        'verified_numbers': verified_numbers,
                        'formatted_number': phone_number
                    }), 400

                # Use ngrok URL if available, otherwise use the request host
                base_url = public_url if public_url else request.host_url.rstrip('/')
                logger.info(f"Using base URL: {base_url}")
                
                # URL encode the parameters
                from urllib.parse import quote
                voice_url = f"{base_url}/voice?shipment_number={quote(shipment_number)}&date_time={quote(time_date)}&detected_temp={quote(detected_temp)}&min_temp={quote(min_temp)}&max_temp={quote(max_temp)}&origin_location={quote(origin_location)}&delivery_location={quote(delivery_location)}"
                
                logger.info(f"Using voice URL: {voice_url}")
                
                # Make real call using Twilio with status callback and parameters
                call = twilio_client.calls.create(
                    to=phone_number,
                    from_="+16067071774",  # Use the working Twilio number
                    url=voice_url,
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
                    'shipmentDetails': shipment_details,
                    'metadata': {
                        'detectedTemperature': detected_temp,
                        'timeDate': time_date,
                        'temperatureRange': temp_range,
                        'shipmentNumber': shipment_number,
                        'originLocation': origin_location,
                        'deliveryLocation': delivery_location
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
                'shipmentDetails': shipment_details,
                'metadata': {
                    'detectedTemperature': detected_temp,
                    'timeDate': time_date,
                    'temperatureRange': temp_range,
                    'shipmentNumber': shipment_number,
                    'originLocation': origin_location,
                    'deliveryLocation': delivery_location
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
@app.route('/api/twilio-status-callback', methods=['GET', 'POST'])
def twilio_status_callback():
    try:
        logger.info(f"Method: {request.method}")
        logger.info(f"Query Params: {request.args}")
        logger.info(f"Form Data: {request.form}")
        logger.info(f"Headers: {dict(request.headers)}")
        logger.info(f"Raw Data: {request.get_data(as_text=True)}")

        call_sid = request.values.get('CallSid')
        call_status = request.values.get('CallStatus')
        call_duration = request.values.get('CallDuration', '0')

        if not call_sid:
            logger.warning("Missing CallSid")
            return 'Missing CallSid', 400

        call_history = get_call_history()
        for call in call_history:
            if call.get('id') == call_sid:
                call['status'] = call_status
                call['duration'] = int(call_duration) if call_duration.isdigit() else 0
                break

        save_call_history(call_history)
        return '', 204
    except Exception as e:
        logger.error(f"Exception in /api/twilio-status-callback: {str(e)}")
        return f"Internal Server Error: {str(e)}", 500



# Add a new endpoint to poll and refresh call status for a specific call
@app.route('/api/calls/<call_sid>/status', methods=['GET'])
def get_call_status(call_sid):
    try:
        call_history = get_call_history()
        call = next((call for call in call_history if call.get('id') == call_sid), None)
        
        if not call:
            return jsonify({
                'success': False,
                'error': f'Call {call_sid} not found'
            }), 404

        return jsonify({
            'success': True,
            'call': call
        })

    except Exception as e:
        logger.error(f"Error getting call status: {e}")
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