from fastapi import FastAPI
import requests
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

if not GEMINI_API_KEY or not WEATHER_API_KEY:
    raise ValueError("Missing API keys. Check your .env file.")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

def get_current_weather(city):
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return {
            "city": city,
            "temperature": round(data["main"]["temp"], 1), 
            "condition": data["weather"][0]["description"]
        }
    else:
        return {"error": f"Could not fetch weather for {city}. Ensure the city name is correct."}

def get_weekly_forecast(city):
    url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={WEATHER_API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        forecast_list = []
        seen_dates = set()  

        for entry in data["list"]:
            date = entry["dt_txt"].split(" ")[0]
            if date not in seen_dates:
                seen_dates.add(date)
                forecast_list.append({
                    "date": date,
                    "temperature": round(entry["main"]["temp"], 1),  
                    "condition": entry["weather"][0]["description"]
                })
            if len(forecast_list) == 7: 
                break

        return forecast_list
    else:
        return {"error": f"Could not fetch weekly forecast for {city}."}

def generate_weather_report(city):
    current_weather = get_current_weather(city)
    weekly_forecast = get_weekly_forecast(city)

    if "error" in current_weather or "error" in weekly_forecast:
        return {"error": f"Unable to fetch weather data for {city}. Please check the city name."}

    forecast_str = "\n".join(
        [f"📅 {day['date']}: {day['temperature']}°C, {day['condition']}" for day in weekly_forecast]
    )

    prompt = f"""
    You are a professional weather assistant. Generate a concise, engaging weather report.
    
    🌍 **Current Weather in {city}**:
    🌡️ Temperature: {current_weather['temperature']}°C
    🌥️ Condition: {current_weather['condition']}
    
    📢 **7-Day Weather Forecast for {city}:**
    {forecast_str}
    """

    try:
        model = genai.GenerativeModel("gemini-1.5-pro")  
        response = model.generate_content(prompt)
        return {
            "city": city,
            "current_weather": current_weather,
            "forecast": weekly_forecast,
            "report": response.text
        }
    except Exception as e:
        return {"error": f"Error generating weather report: {str(e)}"}

@app.get("/weather/{city}")
async def weather_report(city: str):
    return generate_weather_report(city)
