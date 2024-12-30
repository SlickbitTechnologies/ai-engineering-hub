import streamlit as st
from PyPDF2 import PdfReader
import openai
import os
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title='PDF Chat Assistant',
    layout='wide'
)

st.header("PDF Chat Assistant")
openai.api_key = os.getenv("OPENAI_API_KEY")


@st.cache_data
def extract_text_from_pdf(file):
    pdf_reader = PdfReader(file)
    text = ""
    for page in pdf_reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text
    return text


def split_text_into_chunks(text, max_length=1000):
    words = text.split()
    chunks = []
    chunk = []
    current_length = 0

    for word in words:
        if current_length + len(word) + 1 <= max_length:
            chunk.append(word)
            current_length += len(word) + 1
        else:
            chunks.append(" ".join(chunk))
            chunk = [word]
            current_length = len(word) + 1

    if chunk:
        chunks.append(" ".join(chunk))
    return chunks


def generate_response(query, context):
    try:
        messages = [{"role": "system", "content": context}, {"role": "user", "content": query}]
        completion = openai.chat.completions.create(
            model="gpt-4o",
            messages=messages
        )
        return completion.choices[0].message.content
    except Exception as e:
        st.error(f"Error: {e}")
        return "Unable to process your request at this time."


def initialize_session_state():
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    if 'pdf_data' not in st.session_state:
        st.session_state.pdf_data = None
    if 'selected_model' not in st.session_state:
        st.session_state.selected_model = "gpt-3.5-turbo"

def on_change():
    st.session_state.messages=[]


with st.sidebar:
    st.subheader("Settings")
    file = st.file_uploader("Upload a PDF file", type=["pdf"],on_change=on_change)

    model_selection = st.selectbox(
        "Choose GPT Model",
        options=["gpt-4","gpt-3.5-turbo" ],
        index=0,
        key="selected_model"
    )

    if file:

        try:
            pdf_text = extract_text_from_pdf(file)
            st.session_state.pdf_data = pdf_text
            st.success("PDF text extracted successfully!")
        except Exception as e:
            st.error(f"Failed to process the PDF: {e}")
    else:
        st.session_state.pdf_data = None


# Main Chat Interface
def update_ui():
    if st.session_state.pdf_data is None:
        st.write('Please upload a PDF to start the chat.')
    else:
        chunks = split_text_into_chunks(st.session_state.pdf_data)
        prompt = st.chat_input(placeholder="Ask your question...", key='chat_input')

        if prompt:
            st.session_state.messages.append({"role": 'user', "content": prompt})
            print(len(chunks))
            response = generate_response(prompt, "\n\n".join(chunks))

            st.session_state.messages.append({"role": 'assistant', "content": response})

    if len(st.session_state.messages) > 0:
        for item in st.session_state.messages:
            with st.chat_message(item['role']):
                st.markdown(item['content'])



def main():
    initialize_session_state()
    update_ui()

if __name__ == "__main__":
    main()
