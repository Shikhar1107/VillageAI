# VillageAI Backend Documentation

## Overview

The VillageAI backend is a FastAPI application that processes voice queries from farmers and provides agricultural advice. It's currently implemented on the `shikhar` branch and uses AWS services for speech processing.

## Architecture

```
Client (Audio) → FastAPI → S3 → AWS Transcribe → Knowledge Base → AWS Polly → Client (Audio Response)
```

## Tech Stack

- **Framework**: FastAPI 0.134.0
- **Cloud Provider**: AWS (S3, Transcribe, Polly)
- **Language**: Python 3.x
- **Dependencies**: boto3, python-dotenv, uvicorn

## Project Structure

```
backend/
├── main.py                      # FastAPI application entry point
├── config.py                    # AWS configuration
├── requirements.txt             # Python dependencies
├── routes/
│   └── voice.py                # Voice processing endpoint
├── services/
│   ├── s3_service.py          # S3 upload/delete operations
│   ├── transcribe_service.py  # AWS Transcribe integration (STT)
│   ├── knowledge_service.py   # Crop/problem detection logic
│   ├── safety_service.py      # Emergency & pesticide validation
│   ├── polly_service.py       # AWS Polly integration (TTS)
│   └── response_service.py    # Response formatting
├── knowledge_base/
│   └── crops.json             # Agricultural knowledge database
└── utils/
    └── helpers.py             # Utility functions (empty)
```

## API Endpoints

### 1. Health Check
- **Endpoint**: `GET /`
- **Description**: Check if backend is running
- **Response**:
```json
{
  "status": "Village AI backend running"
}
```

### 2. Voice Processing
- **Endpoint**: `POST /voice/process`
- **Description**: Process voice query and return agricultural advice
- **Input**: Audio file (multipart/form-data)
- **Response**:
```json
{
  "transcript": "String - What the farmer said",
  "response": "String - Agricultural advice",
  "audio_url": "String - S3 URL of response audio"
}
```

## Processing Flow

1. **Audio Upload**: Client uploads audio file
2. **S3 Storage**: Audio stored in S3 bucket
3. **Speech-to-Text**: AWS Transcribe converts audio to text
   - Language: en-IN (Indian English)
   - Supports Hindi-English code-mixing
4. **Emergency Check**: Detects emergency keywords
   - Keywords: "poison", "drank pesticide", "spray accident", etc.
   - Immediate alert if detected
5. **Crop Detection**: Identifies crop from transcript
   - Currently supports: wheat (gehun, gehu)
6. **Problem Detection**: Identifies agricultural problem
   - Currently: yellow rust, yellow spots
7. **Solution Retrieval**: Gets solution from knowledge base
8. **Safety Validation**: Validates pesticide recommendations
   - Whitelist check
   - Dosage limits
   - Banned substance detection
9. **Response Generation**: Formats response text
10. **Text-to-Speech**: AWS Polly generates audio response
    - Voice: Aditi (Indian English female)
11. **Return Response**: Audio URL and text returned to client

## AWS Services Configuration

### S3 Configuration
- **Bucket**: Configured via environment variable
- **Purpose**: Store input audio and output TTS files
- **Files**: Temporarily stored, should be cleaned up

### AWS Transcribe
- **Language Code**: en-IN
- **Media Format**: Automatic detection
- **Features**: Supports Indian English with Hindi mixing

### AWS Polly
- **Voice ID**: Aditi (Indian English)
- **Output Format**: MP3
- **Text Type**: Plain text

## Knowledge Base

Currently limited but structured for expansion:

```json
{
  "crops": {
    "wheat": {
      "names": ["wheat", "gehun", "gehu"],
      "problems": {
        "yellow_rust": {
          "symptoms": ["yellow", "rust", "spots", "leaves"],
          "solutions": {
            "organic": "Neem oil spray...",
            "chemical": "Propiconazole 25% EC..."
          }
        }
      }
    }
  }
}
```

## Safety Features

### Emergency Detection
- **Keywords**: "poison", "pesticide accident", "drank", "spray accident"
- **Action**: Immediate alert, bypass normal processing

### Pesticide Validation
- **Whitelist**: Only approved pesticides allowed
  - Propiconazole, Mancozeb, Tebuconazole, Neem oil
- **Banned List**: DDT, Endosulfan
- **Dosage Limits**: Maximum amounts per crop
- **Validation**: Every chemical recommendation validated

## Environment Variables

Required in `.env` file:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name
```

## Dependencies

Key packages (from requirements.txt):
- fastapi==0.134.0
- uvicorn==0.45.1
- boto3==1.35.94
- python-dotenv==1.0.1
- requests==2.32.3
- pydantic==2.10.5
- python-multipart==0.0.29

## Running the Backend

### Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Current Limitations

1. **Limited Crop Support**: Only wheat
2. **Limited Problems**: Only yellow rust
3. **Language**: English/Hindi only (no other regional languages)
4. **No Database**: Using JSON file for knowledge base
5. **No Authentication**: Open endpoints
6. **No Rate Limiting**: Could be abused
7. **File Cleanup**: S3 files not automatically deleted
8. **Single Region**: AWS services in one region only

## Future Enhancements

### Immediate Needs
1. Add more crops (rice, cotton, sugarcane)
2. Add more problems per crop
3. Implement file cleanup in S3
4. Add request/response logging
5. Add error handling and retries

### Medium Term
1. Support for 15+ regional languages
2. Database integration (PostgreSQL/Neo4j)
3. User authentication and profiles
4. Rate limiting
5. Caching layer (Redis)

### Long Term
1. ML model for better intent detection
2. Integration with weather APIs
3. Market price integration
4. Government scheme information
5. Multi-region deployment

## Testing

Currently no tests implemented. Need to add:
- Unit tests for each service
- Integration tests for API endpoints
- Load testing for scalability
- Safety validation tests

## Deployment Considerations

1. **AWS Credentials**: Use IAM roles in production
2. **HTTPS**: Enable SSL/TLS
3. **CORS**: Configure for frontend domains
4. **Monitoring**: Add CloudWatch or similar
5. **Logging**: Structured logging with levels
6. **Backup**: S3 versioning and backups
7. **Scaling**: Auto-scaling groups or container orchestration

## API Usage Example

### Using curl
```bash
curl -X POST "http://localhost:8000/voice/process" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio_query.mp3"
```

### Using Python
```python
import requests

url = "http://localhost:8000/voice/process"
files = {'file': open('audio_query.mp3', 'rb')}
response = requests.post(url, files=files)
print(response.json())
```

## Contact

For backend questions, check with the `shikhar` branch maintainer.