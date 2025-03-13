import streamlit as st
import requests
import pandas as pd

API_URL = "http://127.0.0.1:8000/weather"

WEATHER_ICONS = {
    "clear sky": "☀️",
    "few clouds": "🌤️",
    "scattered clouds": "⛅",
    "broken clouds": "☁️",
    "overcast clouds": "🌥️",
    "light rain": "🌦️",
    "moderate rain": "🌧️",
    "heavy rain": "⛈️",
    "thunderstorm": "⛈️",
    "snow": "❄️",
    "mist": "🌫️"
}

st.title("🌤️ Weather Forecast App")

city = st.text_input("Enter City Name", "Hyderabad")

if st.button("Get Weather Report"):
    response = requests.get(f"{API_URL}/{city}")

    if response.status_code == 200:
        data = response.json()

        if "error" in data:
            st.error(data["error"])
        else:
            forecast = data["forecast"]

            df = pd.DataFrame(forecast)

            df["temperature"] = df["temperature"].apply(lambda x: round(x, 1))

            df["condition"] = df["condition"].apply(lambda x: f"{WEATHER_ICONS.get(x, '🌍')} {x}")

            df.index = range(1, len(df) + 1)

            st.subheader(f"🌡️ Current Weather in {city}")
            st.write(f"**Temperature:** {round(data['current_weather']['temperature'], 1)}°C")
            st.write(f"**Condition:** {data['current_weather']['condition']}")

            st.subheader("📅 7-Day Weather Forecast")
            st.dataframe(df.style.format({"temperature": "{:.1f}"}))  

            st.subheader(" Weather Report")
            st.write(data["report"])
    else:
        st.error("Failed to fetch weather data. Please try again.")
