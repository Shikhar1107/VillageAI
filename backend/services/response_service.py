# services/response_service.py

import re
import json
import os

KB_PATH = os.path.join("knowledge_base", "crops.json")


def _load_crop_data():
    with open(KB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _is_hindi(text: str) -> bool:
    devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
    return devanagari_chars > len(text) * 0.1


def format_response(crop: str, problem: str, solution: dict, transcript: str = ""):
    kb = _load_crop_data()
    crop_data = kb["crops"].get(crop, {})
    hindi = _is_hindi(transcript)

    if hindi:
        crop_name = crop_data.get("hindi_name", crop)
        problem_name = solution.get("hindi_name", problem.replace('_', ' '))
        symptoms = solution.get("symptoms_hi", solution["symptoms"])
        org = solution["organic_solution"]
        chem = solution["chemical_solution"]
        safety = solution.get("safety_notes_hi", solution["safety_notes"])

        response = (
            f"लगता है आपकी {crop_name} की फसल में {problem_name} की समस्या है। "
            f"लक्षण: {symptoms} "
            f"जैविक उपाय: {org.get('name_hi', org['name'])}, "
            f"{org.get('dosage_hi', org['dosage'])}। "
            f"{org.get('method_hi', org['method'])} "
            f"रासायनिक उपाय: {chem.get('name_hi', chem['name'])}, "
            f"{chem.get('dosage_hi', chem['dosage'])}। "
            f"{chem.get('method_hi', chem['method'])} "
            f"सुरक्षा सलाह: {safety}"
        )
    else:
        response = (
            f"I think your {crop} crop may have {problem.replace('_', ' ')}. "
            f"Symptoms include: {solution['symptoms']} "
            f"Organic solution: {solution['organic_solution']['name']}, "
            f"{solution['organic_solution']['dosage']}. "
            f"Chemical option: {solution['chemical_solution']['name']}, "
            f"{solution['chemical_solution']['dosage']}. "
            f"Safety advice: {solution['safety_notes']}"
        )

    return response
