# services/analytics_service.py

import json
import os
import time
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

LOG_FILE = os.path.join(os.path.dirname(__file__), "..", "query_logs.jsonl")


def log_query(transcript: str, language: str, crop: str, problem: str,
              outcome: str, transcription_method: str, response_time: float):
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "transcript": transcript,
        "language": language,
        "crop": crop,
        "problem": problem,
        "outcome": outcome,
        "transcription_method": transcription_method,
        "response_time_s": round(response_time, 2)
    }
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.error(f"Failed to log query: {e}")


def get_analytics():
    entries = []
    try:
        if not os.path.exists(LOG_FILE):
            return _empty_analytics()
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    entries.append(json.loads(line))
    except Exception as e:
        logger.error(f"Failed to read query logs: {e}")
        return _empty_analytics()

    now = datetime.utcnow()
    today = now.date().isoformat()
    week_ago = (now - timedelta(days=7)).isoformat()

    total = len(entries)
    today_entries = [e for e in entries if e["timestamp"].startswith(today)]
    week_entries = [e for e in entries if e["timestamp"] >= week_ago]

    # Outcome counts
    resolved = sum(1 for e in entries if e["outcome"] == "resolved")
    no_crop = sum(1 for e in entries if e["outcome"] == "no_crop")
    no_problem = sum(1 for e in entries if e["outcome"] == "no_problem")
    emergency = sum(1 for e in entries if e["outcome"] == "emergency")
    error = sum(1 for e in entries if e["outcome"] == "error")

    # Crop frequency
    crop_counts = {}
    for e in entries:
        c = e.get("crop")
        if c:
            crop_counts[c] = crop_counts.get(c, 0) + 1

    # Problem frequency
    problem_counts = {}
    for e in entries:
        p = e.get("problem")
        if p:
            problem_counts[p] = problem_counts.get(p, 0) + 1

    # Language split
    hindi_count = sum(1 for e in entries if e.get("language") == "hi")
    english_count = total - hindi_count

    # Avg response time
    times = [e["response_time_s"] for e in entries if e.get("response_time_s")]
    avg_time = round(sum(times) / len(times), 1) if times else 0

    resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0

    return {
        "total_queries": total,
        "queries_today": len(today_entries),
        "queries_this_week": len(week_entries),
        "resolution_rate": resolution_rate,
        "avg_response_time": avg_time,
        "outcomes": {
            "resolved": resolved,
            "no_crop": no_crop,
            "no_problem": no_problem,
            "emergency": emergency,
            "error": error
        },
        "top_crops": dict(sorted(crop_counts.items(), key=lambda x: -x[1])[:10]),
        "top_problems": dict(sorted(problem_counts.items(), key=lambda x: -x[1])[:10]),
        "language_split": {"hindi": hindi_count, "english": english_count},
        "recent_queries": entries[-10:][::-1]
    }


def _empty_analytics():
    return {
        "total_queries": 0,
        "queries_today": 0,
        "queries_this_week": 0,
        "resolution_rate": 0,
        "avg_response_time": 0,
        "outcomes": {"resolved": 0, "no_crop": 0, "no_problem": 0, "emergency": 0, "error": 0},
        "top_crops": {},
        "top_problems": {},
        "language_split": {"hindi": 0, "english": 0},
        "recent_queries": []
    }
