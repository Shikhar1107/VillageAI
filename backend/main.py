# main.py
from fastapi import FastAPI
from routes.voice import router as voice_router

app = FastAPI(title="Village AI Backend")

app.include_router(voice_router)

@app.get("/")
def health_check():
    return {"status": "Village AI backend running"}
