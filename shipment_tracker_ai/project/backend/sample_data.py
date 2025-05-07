import json
import os
from datetime import datetime, timedelta
import random

def create_sample_data():
    """Create sample data for the application."""
    
    # Get the absolute path to the data directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    shipments_file = os.path.join(base_dir, "data", "shipments.json")
    users_file = os.path.join(base_dir, "data", "users.json")
    
    # Create shipments
    shipments = [
        {
            "id": "1",
            "name": "Vaccine Delivery",
            "origin": "Boston, MA",
            "destination": "New York, NY",
            "status": "in-transit",
            "user_id": "1",
            "createdAt": datetime.now().isoformat(),
            "estimatedDelivery": (datetime.now() + timedelta(days=5)).isoformat(),
            "currentTemperature": 5.2,
            "minTemperature": 2.0,
            "maxTemperature": 8.0,
            "currentLocation": {
                "lat": 40.7128,
                "lng": -74.006,
                "address": "Manhattan, NY"
            },
            "temperatureHistory": [
                {
                    "timestamp": (datetime.now() - timedelta(hours=4)).isoformat(),
                    "value": 4.5
                },
                {
                    "timestamp": (datetime.now() - timedelta(hours=3)).isoformat(),
                    "value": 4.8
                },
                {
                    "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                    "value": 5.2
                },
                {
                    "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(),
                    "value": 5.1
                },
                {
                    "timestamp": datetime.now().isoformat(),
                    "value": 5.3
                }
            ],
            "alerts": [
                {
                    "id": "alert-1",
                    "type": "info",
                    "message": "Shipment has departed from Boston",
                    "timestamp": (datetime.now() - timedelta(hours=4)).isoformat(),
                    "location": "Boston, MA",
                    "read": True
                }
            ]
        },
        {
            "id": "2",
            "name": "Blood Samples Delivery",
            "origin": "Chicago, IL",
            "destination": "Milwaukee, WI",
            "status": "in-transit",
            "user_id": "1",
            "createdAt": (datetime.now() - timedelta(days=2)).isoformat(),
            "estimatedDelivery": (datetime.now() + timedelta(days=1)).isoformat(),
            "currentTemperature": 3.8,
            "minTemperature": 2.0,
            "maxTemperature": 6.0,
            "currentLocation": {
                "lat": 42.5818,
                "lng": -87.8286,
                "address": "Kenosha, WI"
            },
            "temperatureHistory": [
                {
                    "timestamp": (datetime.now() - timedelta(hours=10)).isoformat(),
                    "value": 4.0
                },
                {
                    "timestamp": (datetime.now() - timedelta(hours=8)).isoformat(),
                    "value": 3.8
                },
                {
                    "timestamp": (datetime.now() - timedelta(hours=6)).isoformat(),
                    "value": 3.9
                },
                {
                    "timestamp": (datetime.now() - timedelta(hours=4)).isoformat(),
                    "value": 3.7
                },
                {
                    "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                    "value": 3.8
                }
            ],
            "alerts": []
        },
        {
            "id": "3",
            "name": "Organ Transport",
            "origin": "Los Angeles, CA",
            "destination": "San Francisco, CA",
            "status": "delivered",
            "user_id": "1",
            "createdAt": (datetime.now() - timedelta(days=7)).isoformat(),
            "estimatedDelivery": (datetime.now() - timedelta(days=6)).isoformat(),
            "currentTemperature": 4.0,
            "minTemperature": 2.0,
            "maxTemperature": 6.0,
            "currentLocation": {
                "lat": 37.7749,
                "lng": -122.4194,
                "address": "San Francisco, CA"
            },
            "temperatureHistory": [
                {
                    "timestamp": (datetime.now() - timedelta(days=7, hours=8)).isoformat(),
                    "value": 4.2
                },
                {
                    "timestamp": (datetime.now() - timedelta(days=7, hours=6)).isoformat(),
                    "value": 4.0
                },
                {
                    "timestamp": (datetime.now() - timedelta(days=7, hours=4)).isoformat(),
                    "value": 4.1
                },
                {
                    "timestamp": (datetime.now() - timedelta(days=7, hours=2)).isoformat(),
                    "value": 3.9
                },
                {
                    "timestamp": (datetime.now() - timedelta(days=7)).isoformat(),
                    "value": 4.0
                }
            ],
            "alerts": [
                {
                    "id": "alert-1",
                    "type": "info",
                    "message": "Shipment has departed from Los Angeles",
                    "timestamp": (datetime.now() - timedelta(days=7, hours=8)).isoformat(),
                    "location": "Los Angeles, CA",
                    "read": True
                },
                {
                    "id": "alert-2",
                    "type": "info",
                    "message": "Shipment has been delivered successfully",
                    "timestamp": (datetime.now() - timedelta(days=6)).isoformat(),
                    "location": "San Francisco, CA",
                    "read": False
                }
            ]
        }
    ]
    
    # Create users
    users = [
        {
            "id": "1",
            "name": "Demo User",
            "email": "demo@example.com",
            "password": "password123",  # In real app, hash this!
            "createdAt": datetime.now().isoformat()
        }
    ]
    
    # Save to files
    os.makedirs('backend/data', exist_ok=True)
    
    with open(shipments_file, 'w') as f:
        json.dump(shipments, f, indent=2)
    
    with open(users_file, 'w') as f:
        json.dump(users, f, indent=2)

def generate_temperature_history(hours, start_temp, peak_temp):
    """Generate a realistic temperature history."""
    history = []
    now = datetime.now()
    
    for i in range(hours):
        timestamp = (now - timedelta(hours=hours-i)).isoformat()
        
        # Create a temperature curve that rises to a peak and then falls
        if i < hours / 3:
            # Rising phase
            temp = start_temp + (i / (hours / 3)) * (peak_temp - start_temp) * 0.5
        elif i < hours * 2 / 3:
            # Peak phase
            if i == int(hours / 2):
                temp = peak_temp
            else:
                temp = peak_temp - random.uniform(0, 0.5)
        else:
            # Falling phase
            progress = (i - hours * 2 / 3) / (hours / 3)
            temp = peak_temp - progress * (peak_temp - start_temp) * 0.7
        
        # Add some randomness
        temp += random.uniform(-0.3, 0.3)
        
        history.append({
            "timestamp": timestamp,
            "value": round(temp, 1)
        })
    
    return history

def generate_journey():
    """Generate a journey for the first shipment."""
    now = datetime.now()
    journey = [
        {
            "location": "Seattle, WA, USA",
            "timestamp": (now - timedelta(days=2)).isoformat(),
            "temperature": 2.5,
            "status": "completed"
        },
        {
            "location": "Vancouver, BC, Canada",
            "timestamp": (now - timedelta(hours=34)).isoformat(),
            "temperature": 3.0,
            "status": "completed"
        },
        {
            "location": "Kamloops, BC, Canada",
            "timestamp": (now - timedelta(hours=18)).isoformat(),
            "temperature": 8.9,
            "status": "completed"
        },
        {
            "location": "Calgary, AB, Canada",
            "timestamp": (now - timedelta(hours=6)).isoformat(),
            "temperature": 3.8,
            "status": "current"
        },
        {
            "location": "Winnipeg, MB, Canada",
            "timestamp": (now + timedelta(hours=16)).isoformat(),
            "temperature": 0,
            "status": "upcoming"
        },
        {
            "location": "Toronto, ON, Canada",
            "timestamp": (now + timedelta(days=2)).isoformat(),
            "temperature": 0,
            "status": "upcoming"
        }
    ]
    return journey

def generate_journey_2():
    """Generate a journey for the second shipment."""
    now = datetime.now()
    journey = [
        {
            "location": "Boston, MA, USA",
            "timestamp": (now - timedelta(days=1)).isoformat(),
            "temperature": -20.1,
            "status": "completed"
        },
        {
            "location": "Albany, NY, USA",
            "timestamp": (now - timedelta(hours=18)).isoformat(),
            "temperature": -19.5,
            "status": "completed"
        },
        {
            "location": "Buffalo, NY, USA",
            "timestamp": (now - timedelta(hours=6)).isoformat(),
            "temperature": -18.7,
            "status": "current"
        },
        {
            "location": "Cleveland, OH, USA",
            "timestamp": (now + timedelta(hours=10)).isoformat(),
            "temperature": 0,
            "status": "upcoming"
        },
        {
            "location": "Chicago, IL, USA",
            "timestamp": (now + timedelta(days=1)).isoformat(),
            "temperature": 0,
            "status": "upcoming"
        }
    ]
    return journey

if __name__ == "__main__":
    create_sample_data()