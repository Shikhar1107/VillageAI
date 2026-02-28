from fastapi import APIRouter, UploadFile, File
from services.s3_service import upload_audio_file
from services.transcribe_service import start_transcription_job, wait_for_transcription
from services.knowledge_service import detect_crop, detect_problem, get_solution
from services.response_service import format_response
from services.safety_service import check_emergency, validate_pesticide
from services.polly_service import generate_speech

router = APIRouter(prefix="/voice", tags=["Voice"])

@router.post("/process")
async def process_voice(file: UploadFile = File(...)):

#  Upload audio file
    s3_uri = upload_audio_file(file.file, file.filename)

# Start Transcribe
    job_name = start_transcription_job(s3_uri)

# Wait & Get transcribe
    transcript = wait_for_transcription(job_name)

     # Check emergency first
    if check_emergency(transcript):
        response_text = "This sounds like an emergency. Please contact your nearest agricultural officer or emergency service immediately."

        audio_url = generate_speech(response_text)

        return {
            "transcript": transcript,
            "response": response_text,
            "audio_url": audio_url
        }


    crop = detect_crop(transcript)

    if not crop:
        return {"transcript": transcript, "response": "Please mention your crop name clearly."}

    # 🔍 Detect problem
    problem = detect_problem(crop, transcript)

    if not problem:
        return {"transcript": transcript, "response": "Please describe the symptoms clearly."}

    solution = get_solution(crop, problem)

    # Validate pesticide
    is_valid, message = validate_pesticide(crop, solution)

    if not is_valid:
        return {
            "transcript": transcript,
            "response": f"Safety Alert: {message}"
        }

    response_text = format_response(crop, problem, solution)
    print("🧠 Response text ready:", response_text)

    audio_url = generate_speech(response_text)
    print("🔊 Audio URL generated:", audio_url)
    return {
        "transcript": transcript,
        "response": response_text,
        "audio_url":audio_url
    }
