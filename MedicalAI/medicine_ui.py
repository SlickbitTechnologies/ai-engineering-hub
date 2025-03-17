import streamlit as st
import requests

API_URL = "http://127.0.0.1:8000/get_medicine_info/"

st.set_page_config(page_title="MediAId - Medicine Info", layout="centered")

st.title("🔍 MediAId - Medicine Information")

medicine_name = st.text_input("Enter Medicine Name:", "")

if st.button("Get Medicine Info"):
    if medicine_name.strip():
        with st.spinner("Fetching information..."):
            response = requests.post(API_URL, json={"medicine_name": medicine_name})
            
            if response.status_code == 200:
                data = response.json()
                medicine_info = data["medicine_info"]

                if isinstance(medicine_info, dict):
                    text = medicine_info.get("text", "")
                else:
                    text = medicine_info

                st.subheader("Medicine Information")
                st.markdown(text, unsafe_allow_html=True)
            else:
                st.error("Failed to fetch data. Please try again!")
    else:
        st.warning("Please enter a medicine name!")
