# routes/info.py

from fastapi import APIRouter
from services.knowledge_service import knowledge_base
from services.analytics_service import get_analytics

router = APIRouter(tags=["Info"])


@router.get("/knowledge/summary")
def knowledge_summary():
    crops = {}
    for crop_name, crop_data in knowledge_base["crops"].items():
        problems = {}
        for prob_name, prob_data in crop_data["problems"].items():
            problems[prob_name] = {
                "hindi_name": prob_data.get("hindi_name", prob_name.replace("_", " ")),
                "symptoms": prob_data.get("symptoms", ""),
                "symptoms_hi": prob_data.get("symptoms_hi", ""),
            }
        crops[crop_name] = {
            "hindi_name": crop_data.get("hindi_name", crop_name),
            "aliases": crop_data.get("aliases", []),
            "problems": problems
        }

    banned = knowledge_base.get("safety_rules", {}).get("banned_substances", [])

    return {
        "crops": crops,
        "total_crops": len(crops),
        "total_problems": sum(len(c["problems"]) for c in crops.values()),
        "banned_substances": banned
    }


@router.get("/analytics")
def analytics():
    return get_analytics()
