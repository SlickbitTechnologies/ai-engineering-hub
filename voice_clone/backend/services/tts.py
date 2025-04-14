import os
import logging
from pathlib import Path
import numpy as np
from pydub import AudioSegment
import tempfile
import shutil
import time
from resemble import Resemble
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Resemble AI with API key
api_key = os.getenv("RESEMBLE_API_KEY")
if not api_key:
    raise ValueError("RESEMBLE_API_KEY not found in environment variables")
Resemble.api_key = api_key

class VoiceService:
    def __init__(self):
        self.temp_dir = Path("temp")
        self.voices_dir = Path("voices")
        self.initialize_directories()
        
    def initialize_directories(self):
        """Initialize necessary directories"""
        self.temp_dir.mkdir(exist_ok=True)
        self.voices_dir.mkdir(exist_ok=True)
            
    def validate_audio_file(self, file_path: str) -> bool:
        """Validate if the audio file is properly generated"""
        try:
            if not os.path.exists(file_path):
                return False
            
            # Check file size
            if os.path.getsize(file_path) < 1024:  # Less than 1KB is suspicious
                return False
            
            # Try to load the audio file
            audio = AudioSegment.from_file(file_path)
            if len(audio) < 100:  # Less than 100ms is suspicious
                return False
                
            return True
        except Exception as e:
            logger.error(f"Audio validation failed: {e}")
            return False

    def preprocess_audio(self, audio_path: str) -> str:
        """Preprocess audio for better voice cloning quality"""
        try:
            # Load audio
            audio = AudioSegment.from_file(audio_path)
            
            # Convert to mono if stereo
            if audio.channels > 1:
                audio = audio.set_channels(1)
            
            # Normalize volume
            target_db = -20
            change_in_db = target_db - audio.dBFS
            audio = audio.apply_gain(change_in_db)
            
            # Export as WAV with optimal settings
            temp_path = self.temp_dir / f"preprocessed_{int(time.time())}.wav"
            audio.export(str(temp_path), format='wav', 
                        parameters=["-ar", "22050", "-ac", "1"])
            
            # Validate the preprocessed file
            if not self.validate_audio_file(str(temp_path)):
                raise Exception("Preprocessed audio file validation failed")
                
            return str(temp_path)
        except Exception as e:
            logger.error(f"Error preprocessing audio: {e}")
            raise

    def upload_to_resemble(self, file_path: str) -> str:
        """Upload audio file to Resemble AI and return the URL"""
        try:
            # Create a project in Resemble AI
            project = Resemble.Project.create(
                name=f"project_{int(time())}",
                description="Voice cloning project"
            )
            
            # Upload the audio file
            with open(file_path, 'rb') as audio_file:
                upload = Resemble.Upload.create(
                    project_uuid=project.uuid,
                    file=audio_file,
                    name=f"voice_sample_{int(time())}"
                )
            
            return upload.url
        except Exception as e:
            logger.error(f"Error uploading to Resemble AI: {e}")
            raise

    def generate_speech(self, text: str, voice_path: str) -> dict:
        temp_files = []
        try:
            logger.info(f"Generating speech for text: {text[:50]}...")
            
            # Preprocess reference audio for better quality
            processed_voice_path = self.preprocess_audio(voice_path)
            temp_files.append(processed_voice_path)
            
            # Generate temporary output path
            temp_output = self.temp_dir / f"temp_output_{int(time.time())}.wav"
            temp_files.append(str(temp_output))
            
            # Upload the preprocessed audio to Resemble AI
            voice_url = self.upload_to_resemble(processed_voice_path)
            
            # Create a voice clone using Resemble AI URL
            voice = Resemble.Voice.create(
                name=f"voice_{int(time())}",
                url=voice_url,  # Use URL instead of direct file upload
                description="Generated voice for text-to-speech"
            )
            
            # Generate speech using the cloned voice
            response = Resemble.Speech.create(
                voice_uuid=voice.uuid,
                text=text,
                output_format="wav"
            )
            
            # Download the generated audio
            audio_data = response.download()
            with open(temp_output, 'wb') as f:
                f.write(audio_data)
            
            # Validate the generated WAV file
            if not self.validate_audio_file(str(temp_output)):
                raise Exception("Generated WAV file validation failed")
            
            # Generate unique filename for final output
            filename = f"generated_speech_{int(time())}.mp3"
            output_path = self.voices_dir / filename
            
            # Convert to MP3 with high quality
            audio = AudioSegment.from_wav(str(temp_output))
            audio = audio.normalize()
            audio.export(str(output_path), format="mp3", 
                        parameters=["-q:a", "0", "-ar", "44100", "-b:a", "320k"])
            
            # Validate the final output file
            if not self.validate_audio_file(str(output_path)):
                raise Exception("Final audio file validation failed")
            
            # Get the duration
            duration = len(audio) / 1000.0  # Convert to seconds
            
            logger.info(f"Speech generated successfully: {output_path}")
            return {
                "audio_url": f"/voices/{filename}",
                "duration": duration
            }
            
        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            raise
        finally:
            # Cleanup temporary files
            for temp_file in temp_files:
                try:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                except Exception as e:
                    logger.error(f"Error cleaning up temporary file {temp_file}: {e}")

    def cleanup(self):
        """Cleanup resources"""
        # Clean temporary directory
        try:
            shutil.rmtree(str(self.temp_dir))
            self.temp_dir.mkdir(exist_ok=True)
        except Exception as e:
            logger.error(f"Error cleaning temporary directory: {e}")

voice_service = VoiceService() 