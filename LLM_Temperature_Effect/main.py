import os
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Get API key from environment
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class StoryRequest(BaseModel):
    prompt: str
    temperature: float

class TranslationRequest(BaseModel):
    text: str
    language: str

@app.post("/generate-story/")
async def generate_story(data: StoryRequest):
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": data.prompt}],
        "temperature": data.temperature
    }
    
    response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
    
    if response.status_code == 200:
        story_text = response.json()["choices"][0]["message"]["content"]
        return {"story": story_text}
    else:
        return {"error": response.json()}

@app.post("/translate-story/")
async def translate_story(data: TranslationRequest):
    """Passes the generated text to the LLM again for translation."""
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": f"Translate the following text into {data.language}:"},
            {"role": "user", "content": data.text}
        ]
    }
    
    response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
    
    if response.status_code == 200:
        translated_text = response.json()["choices"][0]["message"]["content"]
        return {"translated_story": translated_text}
    else:
        return {"error": response.json()}
