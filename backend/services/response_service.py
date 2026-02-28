# services/response_service.py

def format_response(crop: str, problem: str, solution: dict):

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
