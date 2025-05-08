import json
import os
from datetime import datetime, timedelta
import random

def generate_sample_data():
    shipments = []
    for i in range(1, 6):  # Generate 5 sample shipments
        shipment = {
            "id": str(i),
            "number": f"SHP{i:04d}",
            "status": random.choice(["in_transit", "delivered", "pending"]),
            "currentTemperature": round(random.uniform(2, 8), 1),
            "temperatureThresholds": {
                "min": 2,
                "max": 8
            },
            "location": f"Location {i}",
            "recipientPhone": "+1234567890",
            "timestamp": (datetime.now() - timedelta(days=random.randint(0, 5))).isoformat(),
            "alerts": [],
            "temperatureHistory": []
        }
        
        # Add some temperature history
        for j in range(24):  # Last 24 hours
            temp_reading = {
                "timestamp": (datetime.now() - timedelta(hours=j)).isoformat(),
                "value": round(random.uniform(1, 9), 1)
            }
            shipment["temperatureHistory"].append(temp_reading)
        
        # Add some alerts if temperature was out of range
        for reading in shipment["temperatureHistory"]:
            if reading["value"] < 2 or reading["value"] > 8:
                alert = {
                    "id": f"alert-{len(shipment['alerts']) + 1}",
                    "type": "temperature",
                    "message": f"Temperature {'below' if reading['value'] < 2 else 'above'} threshold: {reading['value']}°C",
                    "timestamp": reading["timestamp"],
                    "location": shipment["location"],
                    "read": False
                }
                shipment["alerts"].append(alert)
        
        shipments.append(shipment)
    
    return shipments

def create_sample_data():
    return generate_sample_data()

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