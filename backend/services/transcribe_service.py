# services/transcribe_service.py

import boto3
import time
import uuid
import requests
from config import AWS_REGION

transcribe_client = boto3.client("transcribe", region_name=AWS_REGION)


def start_transcription_job(s3_uri: str) -> str:
    """
    Starts a transcription job and returns job name
    """

    job_name = f"village-ai-{uuid.uuid4()}"

    transcribe_client.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={"MediaFileUri": s3_uri},
        MediaFormat="wav",  # Change if needed
        LanguageCode="en-IN"
    )

    return job_name


def wait_for_transcription(job_name: str) -> str:
    """
    Polls until transcription completes and returns transcript text
    """
    max_attempts = 30
    attempts = 0
    
    while attempts < max_attempts:
        status = transcribe_client.get_transcription_job(
            TranscriptionJobName=job_name
        )

        job_status = status["TranscriptionJob"]["TranscriptionJobStatus"]

        if job_status == "COMPLETED":
            transcript_url = status["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
            break

        elif job_status == "FAILED":
            raise Exception("Transcription failed")

        time.sleep(2)

        attempts+=1

    # Fetch transcript JSON
    response = requests.get(transcript_url)
    transcript_json = response.json()

    transcript_text = transcript_json["results"]["transcripts"][0]["transcript"]

    return transcript_text
