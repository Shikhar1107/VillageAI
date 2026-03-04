# services/s3_service.py

import boto3
import uuid
from config import S3_BUCKET_NAME, AWS_REGION

s3_client = boto3.client("s3", region_name=AWS_REGION)

def upload_audio_file(file_obj, filename: str) -> str:
    """
    Uploads audio file to S3 and returns S3 URI
    """

    unique_filename = f"input-audio/{uuid.uuid4()}_{filename}"

    # Determine content type based on file extension
    content_type = "audio/webm" if filename.endswith(".webm") else "audio/wav"

    s3_client.upload_fileobj(
        file_obj,
        S3_BUCKET_NAME,
        unique_filename,
        ExtraArgs={"ContentType": content_type}
    )

    s3_uri = f"s3://{S3_BUCKET_NAME}/{unique_filename}"

    return s3_uri


def delete_file(file_key: str):
    s3_client.delete_object(
        Bucket=S3_BUCKET_NAME,
        Key=file_key
    )
