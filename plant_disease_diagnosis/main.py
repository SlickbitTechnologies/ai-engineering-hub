import streamlit as st
from PIL import Image
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
st.set_page_config(
    page_title="Plant Disease Diagnosis",  # Browser tab title
    page_icon='plant.png'  # Emoji or path to an image file
)
st.header(body="Plant Disease Diagnosis",
          anchor=None,
          help='AI-powered models and a user-friendly web interface to diagnose diseases in plants based on uploaded images. The application provides detailed analysis and suggestions for treatment, ensuring healthier plants and effective care.')

st.markdown(
    """
    <style>
    .stFileUploader section  div  small { display: none; }
    </style>
    """,
    unsafe_allow_html=True,
)

uploaded_file = st.file_uploader("Upload image to find disease of plant (Max 250kb, files:jpg, jpeg, png, webp)",
                                 type=["jpg", "jpeg", "png","webp"]
                                 )

genai.configure(api_key= os.getenv("GEMINI_API_KEY"))

generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-exp",
    generation_config=generation_config,
)

def upload_to_gemini(image_path, mime_type=None):
    file = genai.upload_file(image_path, mime_type=mime_type)
    return file
def upload_image(image):

    file_size_in_kb = uploaded_file.size / 1024

    if file_size_in_kb > 250:
        st.error("File size exceeds 250kb. Please upload a smaller file.")
        return

    st.image(image, caption="Uploaded Image", use_container_width=True)
    with open("temp.jpeg", "wb") as f:
        f.write(uploaded_file.getvalue())

    with st.spinner("Analyzing the image for plant diseases..."):
        try:
            gemini_file = upload_to_gemini("temp.jpeg", mime_type="image/jpeg")

            chat_session = model.start_chat(
                history=[
                    {
                        "role": "user",
                        "parts": [
                            gemini_file,
                            "Identify the disease affecting the plant and provide its cure or treatment steps.",
                            "Highlights the disease name and important terms",
                            "Also mention at the end what is the plant and requirements to maintain it healthy."
                            "If no disease found return 'No disease found.'"
                        ],
                    }
                ]
            )

            response = chat_session.send_message("Please analyze the uploaded image.")

            st.write(response.text)

        except Exception as e:
            st.error(f"An error occurred: {e}")


if uploaded_file is not None:
    image = Image.open(uploaded_file)
    upload_image(image)
