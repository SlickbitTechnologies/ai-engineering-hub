import base64
import streamlit as st
import openai
import os
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title='Invoice OCR',
    layout='wide'
)

st.header("Invoice OCR")
openai.api_key = os.getenv("OPENAI_API_KEY")

def initialize_session_state():
    if 'response' not in st.session_state:
        st.session_state.response = None

def generate_response(base64_image):
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Check the image is invoice or not. if it is a invoice image extract the invoice data otherwise response it is not a invoice file. show tabler form for invoice items. also extract vendor details,taxes and all required information. don't include feel free to ask like messages",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": base64_image},
                    },
                ],
            }
        ],
    )
    return response.choices[0].message.content

def on_change():
    st.session_state.response = None

with st.sidebar:
    st.subheader("Settings")
    uploaded_file = st.file_uploader("Upload a Image file",
                                     type=["jpg", "jpeg", "png","webp"],
                                     on_change=on_change)

    if uploaded_file:
        try:
            st.success("Image uploaded successfully!")
            base64_string = base64.b64encode(uploaded_file.read()).decode("utf-8")
            response_data = generate_response(f"data:{uploaded_file.type};base64,{base64_string}")
            st.session_state.response = response_data
        except Exception as e:
            st.error(f"Failed to process the Image")

def update_ui():
    if st.session_state.response is None:
        st.write("Upload an image to process it using OCR.")
    else:
        st.write(st.session_state.response)

def main():
    initialize_session_state()
    update_ui()

if __name__ == "__main__":
    main()