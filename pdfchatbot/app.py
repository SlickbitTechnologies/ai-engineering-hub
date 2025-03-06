import streamlit as st
import google.generativeai as genai
import PyPDF2
import os
from dotenv import load_dotenv
import tempfile

# Load environment variables
load_dotenv()

# Configure Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-2.0-flash')

# Set page config
st.set_page_config(
    page_title="PDF Chatbot",
    page_icon="📚",
    layout="wide"
)

# Initialize session state for chat history and PDF content
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'pdf_content' not in st.session_state:
    st.session_state.pdf_content = None

def extract_text_from_pdf(pdf_file):
    """Extract text from PDF file"""
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

def get_gemini_response(prompt, pdf_content):
    """Get response from Gemini model"""
    context = f"Based on the following PDF content, please answer the question. If the answer cannot be found in the PDF content, please say so.\n\nPDF Content:\n{pdf_content}\n\nQuestion: {prompt}"
    
    response = model.generate_content(context)
    return response.text

# Main UI
st.title("📚 PDF Chatbot")
st.write("Upload a PDF file and ask questions about its content!")

# File uploader
uploaded_file = st.file_uploader("Choose a PDF file", type="pdf")

if uploaded_file is not None:
    # Check file size (2MB limit)
    if uploaded_file.size > 2 * 1024 * 1024:  # 2MB in bytes
        st.error("File size exceeds 2MB limit. Please upload a smaller file.")
    else:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(uploaded_file.getvalue())
            tmp_file_path = tmp_file.name

        # Extract text from PDF
        if st.session_state.pdf_content is None:
            with st.spinner("Processing PDF..."):
                st.session_state.pdf_content = extract_text_from_pdf(tmp_file_path)
                st.success("PDF processed successfully!")

        # Remove temporary file
        os.unlink(tmp_file_path)

        # Display chat interface
        st.subheader("Chat with your PDF")
        
        # Display chat history
        for message in st.session_state.chat_history:
            with st.chat_message(message["role"]):
                st.write(message["content"])

        # Chat input
        if prompt := st.chat_input("Ask a question about your PDF"):
            # Add user message to chat history
            st.session_state.chat_history.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.write(prompt)

            # Get and display assistant response
            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    response = get_gemini_response(prompt, st.session_state.pdf_content)
                    st.write(response)
                    st.session_state.chat_history.append({"role": "assistant", "content": response})

else:
    st.info("Please upload a PDF file to start chatting!") 