# services/safety_service.py

from services.knowledge_service import knowledge_base


def check_emergency(transcript: str):
    transcript = transcript.lower()

    emergency_keywords = knowledge_base["safety_rules"]["emergency_keywords"]

    for phrase in emergency_keywords:
        words = phrase.split()

        # Check if all words exist in transcript
        if all(word in transcript for word in words):
            return True

    return False


def validate_pesticide(crop: str, solution: dict):
    whitelist = knowledge_base["pesticide_whitelist"]

    chemical = solution["chemical_solution"]["name"]
    dosage_text = solution["chemical_solution"]["dosage"]

    # Extract numeric dosage
    try:
        dosage_value = float(dosage_text.split(" ")[0])
    except:
        return False, "Invalid dosage format."

    for item in whitelist:
        if item["name"] == chemical:
            if crop not in item["approved_crops"]:
                return False, f"{chemical} is not approved for {crop}."

            if dosage_value > item["max_dosage_ml_per_liter"]:
                return False, "Dosage exceeds safe limit."

            return True, "Approved"

    return False, f"{chemical} is not in approved pesticide list."
