# services/knowledge_service.py

import json
import os

KB_PATH = os.path.join("knowledge_base", "crops.json")

with open(KB_PATH, "r", encoding="utf-8") as f:
    knowledge_base = json.load(f)


def detect_crop(transcript: str):
    transcript = transcript.lower()

    for crop_name, crop_data in knowledge_base["crops"].items():
        for alias in crop_data["aliases"]:
            if alias in transcript:
                return crop_name

    return None


def detect_problem(crop: str, transcript: str):
    transcript = transcript.lower()
    problems = knowledge_base["crops"][crop]["problems"]

    for problem_name, problem_data in problems.items():
        for keyword in problem_data["keywords"]:
            if keyword in transcript:
                return problem_name

    return None


def get_solution(crop: str, problem: str):
    return knowledge_base["crops"][crop]["problems"][problem]
