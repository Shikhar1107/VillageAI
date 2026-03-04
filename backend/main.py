# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.voice import router as voice_router
from routes.info import router as info_router

app = FastAPI(title="Village AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://13.233.33.236", "http://13.233.33.236"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_router)
app.include_router(info_router)

@app.get("/")
def health_check():
    return {"status": "Village AI backend running"}
