import streamlit as st
from PIL import Image
import google.generativeai as genai
import os
from dotenv import load_dotenv
import pandas as pd
load_dotenv()
st.set_page_config(
    page_title="Chat with excel",  # Browser tab title
    page_icon='plant.png' ,
    layout='wide'
)
st.subheader(body="Chat with Excel",
          anchor=None)

st.markdown(
    """
    <style>
    .stFileUploader section  div  small { display: none; }
    </style>
    """,
    unsafe_allow_html=True,
)


genai.configure(api_key= os.getenv("GEMINI_API_KEY"))

generation_config = {
    "temperature": 0.6,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}


def on_change():
    st.session_state.history = []
    st.session_state.xlsx = None

with st.sidebar:
    st.subheader("Settings")
    file = st.file_uploader("Upload a Excel file", type=["xlsx"],on_change=on_change)

    if file:
        try:
            data = pd.read_excel(file, sheet_name=0)
            data_json = data.to_json(orient="records")
            st.session_state.xlsx = data_json
            st.success("Excel text extracted successfully!")
        except Exception as e:
            st.error(f"Failed to process the PDF: {e}")
    else:
        st.session_state.pdf_data = None
def generate_response(gemini_file,prompt_text):
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash-exp",
        generation_config=generation_config,
        system_instruction=f"This is a uploaded excel document data. data: {gemini_file}."
                           f"If the question is about what is document like then summarize the document. Don't list the column names"
    )

    chat_session = model.start_chat(
        history=st.session_state.history
    )

    response = chat_session.send_message(prompt_text)
    return response

def initialize_session_state():
    if 'xlsx' not in st.session_state:
        st.session_state.xlsx = None
    if 'history' not in st.session_state:
        st.session_state.history = []
def update_ui():
    if st.session_state.xlsx is None:
        st.write('Please upload a PDF to start the chat.')
    else:
        prompt = st.chat_input(placeholder="Ask your question...", key='chat_input')
        if prompt:
            st.session_state.history.append({"role":"user","parts":[prompt]})
            response = generate_response(st.session_state.xlsx,prompt)
            st.session_state.history.append({"role": "model", "parts": [response.text]})

    if len(st.session_state.history) > 0:
        for item in st.session_state.history:
            role =  'user'
            if item['role'] == 'model':
                role = 'assistant'
            with st.chat_message(role):
                st.markdown(item['parts'][0])

def main():
    initialize_session_state()
    update_ui()

if __name__ == "__main__":
    main()