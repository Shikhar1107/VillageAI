# services/transcribe_service.py

import boto3
import time
import uuid
import requests
import logging
from config import AWS_REGION

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

transcribe_client = boto3.client("transcribe", region_name=AWS_REGION)


def start_transcription_job(s3_uri: str) -> str:
    """
    Starts a transcription job and returns job name
    """

    job_name = f"village-ai-{uuid.uuid4()}"

    try:
        transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": s3_uri},
            MediaFormat="wav",
            IdentifyLanguage=True,
            LanguageOptions=["en-IN", "hi-IN"]
        )
    except Exception as e:
        print(f"Error starting transcription job: {e}")
        raise

    return job_name


def wait_for_transcription(job_name: str) -> str:
    """
    Polls until transcription completes and returns transcript text
    """
    max_attempts = 30
    attempts = 0

    while attempts < max_attempts:
        try:
            status = transcribe_client.get_transcription_job(
                TranscriptionJobName=job_name
            )

            job_status = status["TranscriptionJob"]["TranscriptionJobStatus"]

            if job_status == "COMPLETED":
                transcript_url = status["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
                break

            elif job_status == "FAILED":
                failure_reason = status["TranscriptionJob"].get("FailureReason", "Unknown reason")
                raise Exception(f"Transcription failed: {failure_reason}")

        except Exception as e:
            print(f"Error checking transcription job status: {e}")
            raise

        time.sleep(2)

        attempts+=1

    if attempts >= max_attempts:
        raise Exception("Transcription timed out after 60 seconds")

    # Fetch transcript JSON
    response = requests.get(transcript_url)
    transcript_json = response.json()

    transcript_text = transcript_json["results"]["transcripts"][0]["transcript"]
    logger.info(f"AWS Transcribe completed successfully")
    return transcript_text


def transcribe_with_aws(s3_uri: str) -> str:
    """
    Complete AWS transcription workflow
    Returns transcript text or raises exception
    """
    try:
        job_name = start_transcription_job(s3_uri)
        transcript = wait_for_transcription(job_name)
        return transcript
    except Exception as e:
        logger.error(f"AWS Transcribe failed: {e}")
        raise
