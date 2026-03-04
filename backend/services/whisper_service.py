# services/whisper_service.py

try:
    import whisper
except ImportError:
    whisper = None
import tempfile
import os
import logging
from pydub import AudioSegment
from config import WHISPER_MODEL_SIZE, WHISPER_LANGUAGE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load model once at module level (cache for performance)
_whisper_model = None

def get_whisper_model():
    """Lazy load Whisper model to avoid loading on import"""
    global _whisper_model
    if whisper is None:
        raise ImportError("openai-whisper is not installed. Install it with: pip install openai-whisper")
    if _whisper_model is None:
        logger.info(f"Loading Whisper model: {WHISPER_MODEL_SIZE}")
        _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
        logger.info("Whisper model loaded successfully")
    return _whisper_model


def convert_webm_to_wav(webm_file_path: str) -> str:
    """
    Convert webm audio to wav format for Whisper
    Returns path to temporary wav file
    """
    try:
        logger.info(f"Converting {webm_file_path} to WAV format")
        audio = AudioSegment.from_file(webm_file_path, format="webm")

        # Create temporary wav file
        wav_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        wav_path = wav_file.name
        wav_file.close()

        # Export as wav
        audio.export(wav_path, format="wav")
        logger.info(f"Conversion successful: {wav_path}")
        return wav_path

    except Exception as e:
        logger.error(f"Error converting audio format: {e}")
        raise


def transcribe_audio_with_whisper(audio_file_path: str, file_format: str = "webm") -> str:
    """
    Transcribe audio file using local Whisper model

    Args:
        audio_file_path: Path to audio file (can be webm, wav, mp3, etc.)
        file_format: Format of the audio file

    Returns:
        Transcribed text
    """
    temp_wav_path = None

    try:
        # Convert webm to wav if needed
        if file_format == "webm":
            temp_wav_path = convert_webm_to_wav(audio_file_path)
            transcribe_path = temp_wav_path
        else:
            transcribe_path = audio_file_path

        # Load model
        model = get_whisper_model()

        # Transcribe
        logger.info(f"Starting Whisper transcription for {transcribe_path}")
        result = model.transcribe(
            transcribe_path,
            language=WHISPER_LANGUAGE,
            fp16=False  # Use FP32 for CPU compatibility
        )

        transcript_text = result["text"].strip()
        logger.info(f"Whisper transcription successful: {transcript_text[:100]}...")

        return transcript_text

    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        raise

    finally:
        # Clean up temporary wav file
        if temp_wav_path and os.path.exists(temp_wav_path):
            try:
                os.unlink(temp_wav_path)
                logger.info(f"Cleaned up temporary file: {temp_wav_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up temp file {temp_wav_path}: {e}")


def transcribe_uploaded_file(file_obj, filename: str) -> str:
    """
    Transcribe audio from FastAPI UploadFile

    Args:
        file_obj: File object from FastAPI
        filename: Original filename

    Returns:
        Transcribed text
    """
    temp_input_path = None

    try:
        # Determine file format from filename
        file_format = filename.split('.')[-1].lower() if '.' in filename else 'webm'

        # Save uploaded file to temporary location
        temp_input = tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_format}")
        temp_input_path = temp_input.name

        # Write uploaded content to temp file
        file_obj.seek(0)
        temp_input.write(file_obj.read())
        temp_input.close()

        # Transcribe
        transcript = transcribe_audio_with_whisper(temp_input_path, file_format)

        return transcript

    except Exception as e:
        logger.error(f"Error transcribing uploaded file: {e}")
        raise

    finally:
        # Clean up temp input file
        if temp_input_path and os.path.exists(temp_input_path):
            try:
                os.unlink(temp_input_path)
            except Exception as e:
                logger.warning(f"Failed to clean up temp file {temp_input_path}: {e}")