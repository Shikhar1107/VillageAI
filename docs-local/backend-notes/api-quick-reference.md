# VillageAI API Quick Reference

## Base URL
```
Development: http://localhost:8000
Production: TBD
```

## Endpoints

### 1. Health Check
```http
GET /
```

**Response (200 OK)**:
```json
{
  "status": "Village AI backend running"
}
```

---

### 2. Process Voice Query
```http
POST /voice/process
Content-Type: multipart/form-data
```

**Request Body**:
- `file`: Audio file (MP3, WAV, etc.)

**Success Response (200 OK)**:
```json
{
  "transcript": "My wheat crop has yellow spots on leaves",
  "response": "Your wheat crop appears to have yellow rust. Organic solution: Spray neem oil...",
  "audio_url": "https://s3.amazonaws.com/bucket/response_audio.mp3"
}
```

**Error Responses**:

*Emergency Detected*:
```json
{
  "transcript": "I accidentally drank pesticide",
  "response": "This sounds like an emergency. Please contact your nearest agricultural officer or emergency service immediately.",
  "audio_url": "https://s3.amazonaws.com/bucket/emergency_response.mp3"
}
```

*Crop Not Detected*:
```json
{
  "transcript": "There are spots on my plants",
  "response": "Please mention your crop name clearly."
}
```

*Problem Not Detected*:
```json
{
  "transcript": "My wheat crop",
  "response": "Please describe the symptoms clearly."
}
```

*Safety Alert*:
```json
{
  "transcript": "My wheat needs DDT spray",
  "response": "Safety Alert: DDT is banned. Please use approved alternatives."
}
```

---

## Supported Crops
- Wheat (gehun, gehu)

## Supported Problems
- Yellow rust (yellow spots on leaves)

## Supported Languages
- English
- Hindi (mixed with English)

## AWS Services Used
- **S3**: Audio file storage
- **Transcribe**: Speech-to-Text (en-IN)
- **Polly**: Text-to-Speech (Aditi voice)

## Rate Limits
- None currently (TODO)

## Authentication
- None currently (TODO)

## Example Usage

### JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('file', audioFile);

const response = await fetch('http://localhost:8000/voice/process', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log('Transcript:', data.transcript);
console.log('Response:', data.response);
console.log('Audio URL:', data.audio_url);
```

### Python/Requests
```python
import requests

with open('query.mp3', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/voice/process', files=files)

data = response.json()
print(f"Transcript: {data['transcript']}")
print(f"Response: {data['response']}")
print(f"Audio URL: {data['audio_url']}")
```

### cURL
```bash
curl -X POST http://localhost:8000/voice/process \
  -F "file=@farmer_query.mp3" \
  | jq
```

## Status Codes
- `200 OK`: Successful processing
- `400 Bad Request`: Invalid input
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Notes
- Audio files are temporarily stored in S3
- Response audio is generated using AWS Polly
- Emergency keywords trigger immediate alerts
- All pesticide recommendations are safety-validated