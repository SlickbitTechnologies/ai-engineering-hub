import hashlib
import tempfile
import time

import cv2
import streamlit as st
from google import genai
from google.genai import types

# Define the base URL for the Multimodal Live API

GOOGLE_API_KEY = 'AIzaSyADWpv8JM4ihsOACLUV_rAoMAJtnrjWiis'

client = genai.Client(api_key=GOOGLE_API_KEY)

system_instructions = """
    When given a video and a query, call the relevant function only once with the appropriate timecodes and text for the video
  """

model_name = "gemini-2.0-flash-exp"

avatars = {
    "assistant": "🤖",
    "user": "👤",
    "system": "⚡"
}


def upload_video(video_file_name):
    video_file = client.files.upload(path=video_file_name, config={'mime_type': "video/mp4"})

    while video_file.state == "PROCESSING":
        print('Waiting for video to be processed.')
        time.sleep(10)
        video_file = client.files.get(name=video_file.name)

    if video_file.state == "FAILED":
        raise ValueError(video_file.state)
    print(f'Video processing complete: ' + video_file.uri)
    return video_file


def calculate_file_hash(file_path):
    hasher = hashlib.md5()
    with open(file_path, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()


def generate_response(video_file, query):
    contents = [types.Content(
        role="user",
        parts=[
            types.Part.from_uri(
                file_uri=video_file.uri,
                mime_type=video_file.mime_type),
        ]),
        query,
    ]

    response = client.models.generate_content(model=model_name, contents=contents)
    return response.text


# Set up the Streamlit App
st.set_page_config(
    page_title="Chat with your Video",
    layout="wide"
)
st.title("Chat with your Video")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Initialize video file information
if "video_file" not in st.session_state:
    st.session_state.video_file = None
    st.session_state.video_path = None

chat_placeholder = st.container()

with st.sidebar:
    st.title("Chat with your Video")
    uploaded_file = st.file_uploader(
        "Upload an video...",
        type=["mp4"]
    )

    if uploaded_file:
        with st.spinner("Uploading video..."):
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(uploaded_file.read())
                temp_file_path = temp_file.name

            video = cv2.VideoCapture(temp_file_path)
            st.video(temp_file_path, muted=True)

            # Calculate the hash of the uploaded file
            file_hash = calculate_file_hash(temp_file_path)

            # Upload video only if it's a new file
            if st.session_state.get('video_hash') != file_hash:
                st.session_state.video_file = upload_video(temp_file_path)
                st.session_state.video_path = temp_file_path
                st.session_state.video_hash = file_hash

                # Generate and display response for the query "Describe the video"
                with chat_placeholder:
                    with st.spinner('Generating response...'):
                        try:
                            query = 'Describe the video'
                            response = generate_response(st.session_state.video_file, query)

                            st.session_state.messages.append({
                                "role": "system",
                                "content": query
                            })
                            st.session_state.messages.append({
                                "role": "assistant",
                                "content": response
                            })

                        except Exception as e:
                            st.error(f"An error occurred: {str(e)}")
                            query = "Describe the video"
                            response = "An error occurred while generating response. Please try again."

with chat_placeholder:
    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"], avatar=avatars.get(message["role"], None)):
            st.markdown(message["content"])

# User input handling
prompt = st.chat_input("What do you want to know?")

if prompt:
    # Add user message to chat history
    st.session_state.messages.append({
        "role": "user",
        "content": prompt
    })

    # Display user message
    with chat_placeholder:
        with st.chat_message("user", avatar=avatars.get("user", None)):
            st.markdown(prompt)

    # Generate and display response
    with st.spinner('Generating response...'):
        try:
            response = generate_response(st.session_state.video_file, prompt)
            with chat_placeholder:
                with st.chat_message("assistant", avatar=avatars.get("assistant", None)):
                    st.markdown(response)

            # Add assistant response to chat history
            st.session_state.messages.append({
                "role": "assistant",
                "content": response
            })
        except Exception as e:
            st.error(f"An error occurred: {str(e)}")
