# services/knowledge_service.py

import json
import os
import unicodedata

KB_PATH = os.path.join("knowledge_base", "crops.json")


def _load_knowledge_base():
    with open(KB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


knowledge_base = _load_knowledge_base()


def _normalize(text: str) -> str:
    return unicodedata.normalize("NFC", text).lower()


def detect_crop(transcript: str):
    transcript = _normalize(transcript)

    for crop_name, crop_data in knowledge_base["crops"].items():
        for alias in crop_data["aliases"]:
            if _normalize(alias) in transcript:
                return crop_name

    return None


def detect_problem(crop: str, transcript: str):
<<<<<<< HEAD
    transcript = transcript.lower()
=======
    transcript = _normalize(transcript)
>>>>>>> dev
    problems = knowledge_base["crops"][crop]["problems"]

    for problem_name, problem_data in problems.items():
        for keyword in problem_data["keywords"]:
<<<<<<< HEAD
            if keyword in transcript:
=======
            if _normalize(keyword) in transcript:
>>>>>>> dev
                return problem_name

    return None


def get_solution(crop: str, problem: str):
    return knowledge_base["crops"][crop]["problems"][problem]
