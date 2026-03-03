# services/polly_service.py

import boto3
import uuid
import logging
from config import AWS_REGION, S3_BUCKET_NAME

logging.basicConfig(level=logging.INFO)
session = boto3.Session()
polly_client = session.client("polly", region_name=AWS_REGION)
s3_client = session.client("s3", region_name=AWS_REGION)


def generate_speech(text: str) -> str:

    logging.info("🔊 Starting Polly synthesis...")
    logging.info(f"Text length: {len(text)} characters")
    try:
        response = polly_client.synthesize_speech(
            Text=text,
            OutputFormat="mp3",
            VoiceId="Kajal",
            Engine="neural"
        )

        audio_stream = response["AudioStream"].read()

        file_key = f"output-audio/{uuid.uuid4()}.mp3"

        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=file_key,
            Body=audio_stream,
            ContentType="audio/mpeg"
        )

        # Generate temporary access URL
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": file_key},
            ExpiresIn=3600
        )

        return url
    
    except Exception as e:
        logging.error(f"❌ Polly Error: {str(e)}")
        raise
