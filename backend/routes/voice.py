from fastapi import APIRouter, UploadFile, File, HTTPException
from services.s3_service import upload_audio_file
from services.transcribe_service import transcribe_with_aws
from services.whisper_service import transcribe_uploaded_file
from services.knowledge_service import detect_crop, detect_problem, get_solution
from services.response_service import format_response, _is_hindi
from services.safety_service import check_emergency, validate_pesticide
from services.polly_service import generate_speech
from services.analytics_service import log_query
from config import ENABLE_WHISPER_FALLBACK
import logging
import re
import io
import time
import tempfile
import os
from pydub import AudioSegment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice"])


@router.post("/process")
async def process_voice(file: UploadFile = File(...)):
    start_time = time.time()
    transcript = None
    aws_error = None

    # Read file content once, convert webm→wav for AWS compatibility
    file_content = await file.read()
    filename = file.filename or "query.webm"

    # Convert webm to wav (AWS Transcribe doesn't support webm)
    try:
        logger.info("Converting audio to WAV format...")
        audio = AudioSegment.from_file(io.BytesIO(file_content), format="webm")
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_content = wav_buffer.getvalue()
        wav_filename = filename.rsplit(".", 1)[0] + ".wav"
        logger.info(f"Converted to WAV: {len(wav_content)} bytes")
    except Exception as e:
        logger.warning(f"WAV conversion failed, using original: {e}")
        wav_content = file_content
        wav_filename = filename

    # Try AWS Transcribe first
    try:
        logger.info("Attempting AWS Transcribe...")
        s3_uri = upload_audio_file(io.BytesIO(wav_content), wav_filename)
        transcript = transcribe_with_aws(s3_uri)
        logger.info(f"AWS Transcribe successful: {transcript}")

    except Exception as e:
        aws_error = str(e)
        logger.warning(f"AWS Transcribe failed: {aws_error}")

        # Fallback to Whisper if enabled
        if ENABLE_WHISPER_FALLBACK:
            try:
                logger.info("Falling back to Whisper...")
                transcript = transcribe_uploaded_file(io.BytesIO(wav_content), wav_filename)
                logger.info(f"Whisper transcription successful: {transcript}")

            except Exception as whisper_error:
                logger.error(f"Whisper fallback also failed: {whisper_error}")
                raise HTTPException(
                    status_code=500,
                    detail=f"All transcription methods failed. AWS: {aws_error}, Whisper: {str(whisper_error)}"
                )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"AWS Transcribe failed and fallback is disabled: {aws_error}"
            )

    if transcript is None:
        raise HTTPException(
            status_code=500,
            detail="Transcription failed to produce text"
        )

    method = "aws" if aws_error is None else "whisper"
    lang = "hi" if _is_hindi(transcript) else "en"

    if not transcript.strip():
        log_query("", lang, "", "", "empty", method, time.time() - start_time)
        return {
            "transcript": "",
            "response": "No speech was detected. Please try again and speak clearly into the microphone.",
            "transcription_method": method
        }

    # Check emergency first
    hindi = lang == "hi"
    if check_emergency(transcript):
        response_text = ("यह एक आपातकालीन स्थिति लग रही है। कृपया तुरंत अपने नजदीकी कृषि अधिकारी या आपातकालीन सेवा से संपर्क करें।"
            if hindi else
            "This sounds like an emergency. Please contact your nearest agricultural officer or emergency service immediately.")
        audio_url = generate_speech(response_text)
        log_query(transcript, lang, "", "", "emergency", method, time.time() - start_time)
        return {
            "transcript": transcript,
            "response": response_text,
            "audio_url": audio_url,
            "transcription_method": method
        }

    crop = detect_crop(transcript)
    if not crop:
        response_text = ("कृपया अपनी फसल का नाम स्पष्ट रूप से बताएं। जैसे: गेहूं, धान, कपास, टमाटर, आलू, गन्ना, मक्का, या सरसों।"
            if hindi else
            "Please mention your crop name clearly. For example: wheat, rice, cotton, tomato, potato, sugarcane, maize, or mustard.")
        audio_url = generate_speech(response_text)
        log_query(transcript, lang, "", "", "no_crop", method, time.time() - start_time)
        return {
            "transcript": transcript,
            "response": response_text,
            "audio_url": audio_url,
            "transcription_method": method
        }

    problem = detect_problem(crop, transcript)
    if not problem:
        response_text = ("कृपया लक्षण स्पष्ट रूप से बताएं। जैसे: पीले धब्बे, भूरे धब्बे, कीड़े, पत्ते मुड़ना, या सूखना।"
            if hindi else
            "Please describe the symptoms clearly. For example: yellow spots, brown spots, insects, leaf curling, or drying.")
        audio_url = generate_speech(response_text)
        log_query(transcript, lang, crop, "", "no_problem", method, time.time() - start_time)
        return {
            "transcript": transcript,
            "response": response_text,
            "audio_url": audio_url,
            "transcription_method": method
        }

    solution = get_solution(crop, problem)

    is_valid, message = validate_pesticide(crop, solution)
    if not is_valid:
        log_query(transcript, lang, crop, problem, "safety_alert", method, time.time() - start_time)
        return {
            "transcript": transcript,
            "response": f"Safety Alert: {message}",
            "transcription_method": method
        }

    response_text = format_response(crop, problem, solution, transcript)
    logger.info(f"Response text ready: {response_text}")

    audio_url = generate_speech(response_text)
    logger.info(f"Audio URL generated: {audio_url}")

    log_query(transcript, lang, crop, problem, "resolved", method, time.time() - start_time)
    return {
        "transcript": transcript,
        "response": response_text,
        "audio_url": audio_url,
        "transcription_method": method
    }
