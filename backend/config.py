# config.py
import os
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Whisper Configuration
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")  # tiny, base, small, medium, large
WHISPER_LANGUAGE = os.getenv("WHISPER_LANGUAGE", "en")
ENABLE_WHISPER_FALLBACK = os.getenv("ENABLE_WHISPER_FALLBACK", "true").lower() == "true"
