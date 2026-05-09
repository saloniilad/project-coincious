"""
math_views.py
=============
API endpoints for the MathGame component.

Endpoints:
  GET  /api/math/question/          → fetch a question by module + difficulty
  POST /api/math/attempt/save/      → save a completed question attempt
  GET  /api/math/level-stars/       → get best stars per level per module for a user
  GET  /api/math/level-question/    → get the exact question_id played at a given level
                                      (so revisiting a level shows the same question)
"""

import re
from datetime import datetime
from bson import ObjectId
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import random
from ai.predictor import predict_next_difficulty

from .db import (
    get_users_collection,
    get_modules_collection,
    get_questions_collection,
    get_level_attempts_collection,
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _find_user(name: str):
    users = get_users_collection()
    return users.find_one(
        {"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}
    )


def _find_module(name: str):
    modules = get_modules_collection()
    return modules.find_one(
        {"module_name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}
    )


def _serialize_question(doc):
    raw_currency_ids = doc.get("currency_ids") or []
    currency_ids = [str(cid) for cid in raw_currency_ids]

    raw_item_id = doc.get("item_id")
    item_id = str(raw_item_id) if raw_item_id else None

    return {
        "question_id":     str(doc["_id"]),
        "difficulty":      doc["difficulty"],
        "question_text":   doc["question_text"],
        "options":         doc.get("options"),
        "correct_answer":  doc.get("correct_answer"),
        "expected_answer": doc.get("expected_answer"),
        "problem_type":    doc["problem_type"],
        "currency_ids":    currency_ids,
        "item_id":         item_id,
    }

# ── Difficulty ordering ────────────────────────────────────────────────────────

DIFFICULTY_STEPS = [
    "easy-basic",
    "easy-moderate",
    "easy-high",
    "medium-basic",
    "medium-moderate",
    "medium-high",
    "hard-basic",
    "hard-moderate",
    "hard-high",
]

LEVEL_TO_DIFFICULTY_INDEX = {
    1: 0,   # easy-basic
    2: 0,
    3: 1,   # easy-moderate
    4: 1,
    5: 2,   # easy-high
    6: 3,   # medium-basic
    7: 4,   # medium-moderate
    8: 5,   # medium-high
    9: 6,   # hard-basic
    10: 7,  # hard-moderate
}


def get_difficulty_for_level(level: int) -> str:
    idx = LEVEL_TO_DIFFICULTY_INDEX.get(level, 0)
    return DIFFICULTY_STEPS[idx]


def step_difficulty(current_difficulty: str, direction: str) -> str:
    try:
        idx = DIFFICULTY_STEPS.index(current_difficulty)
    except ValueError:
        idx = 0

    if direction == "up":
        idx = min(idx + 1, len(DIFFICULTY_STEPS) - 1)
    elif direction == "down":
        idx = max(idx - 1, 0)

    return DIFFICULTY_STEPS[idx]


def calculate_stars(attempts: int, time_spent: float, hints_used: int) -> int:
    score = 100
    score -= attempts * 5
    score -= hints_used * 10
    score -= time_spent * 0.5
    if score >= 80:
        return 3
    elif score >= 50:
        return 2
    else:
        return 1


def performance_direction(stars: int) -> str:
    if stars == 3:
        return "up"
    elif stars == 2:
        return "stay"
    else:
        return "down"


# ── Views ──────────────────────────────────────────────────────────────────────

@api_view(["GET"])
def get_question(request):
    """
    GET /api/math/question/?module=addition&difficulty=easy-basic&exclude_ids=id1,id2
    """
    module_name = request.query_params.get("module", "").strip().lower()
    difficulty  = request.query_params.get("difficulty", "").strip().lower()
    exclude_raw = request.query_params.get("exclude_ids", "")

    if not module_name or not difficulty:
        return Response(
            {"error": "module and difficulty are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    module = _find_module(module_name)
    if not module:
        return Response({"error": f"Module '{module_name}' not found."}, status=status.HTTP_404_NOT_FOUND)

    exclude_ids = []
    if exclude_raw:
        for raw_id in exclude_raw.split(","):
            raw_id = raw_id.strip()
            if raw_id:
                try:
                    exclude_ids.append(ObjectId(raw_id))
                except Exception:
                    pass

    questions_col = get_questions_collection()
    query = {
        "module_id": module["_id"],
        "difficulty": difficulty,
    }
    if exclude_ids:
        query["_id"] = {"$nin": exclude_ids}

    all_matching = list(questions_col.find(query))

    if not all_matching:
        all_matching = list(questions_col.find({
            "module_id": module["_id"],
            "difficulty": difficulty,
        }))

    if not all_matching:
        return Response(
            {"error": f"No questions found for {module_name} / {difficulty}."},
            status=status.HTTP_404_NOT_FOUND,
        )

    question = random.choice(all_matching)
    return Response({"question": _serialize_question(question)}, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_question_by_id(request):
    """
    GET /api/math/question/by-id/?question_id=<id>
    """
    qid_raw = request.query_params.get("question_id", "").strip()
    if not qid_raw:
        return Response({"error": "question_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        qid = ObjectId(qid_raw)
    except Exception:
        return Response({"error": "Invalid question_id."}, status=status.HTTP_400_BAD_REQUEST)

    questions_col = get_questions_collection()
    doc = questions_col.find_one({"_id": qid})
    if not doc:
        return Response({"error": "Question not found."}, status=status.HTTP_404_NOT_FOUND)

    return Response({"question": _serialize_question(doc)}, status=status.HTTP_200_OK)


@api_view(["POST"])
def save_level_attempt(request):
    """
    POST /api/math/attempt/save/
    """
    data        = request.data
    name        = data.get("name", "").strip()
    module_name = data.get("module", "").strip().lower()
    level       = data.get("level")
    question_id = data.get("question_id", "").strip()
    attempts    = int(data.get("attempts", 1))
    time_spent  = float(data.get("time_spent", 0))
    hints_used  = int(data.get("hints_used", 0))
    user_answer = data.get("user_answer")
    difficulty  = data.get("difficulty", "easy-basic").strip()

    if not all([name, module_name, level is not None, question_id]):
        return Response({"error": "name, module, level, question_id are required."}, status=status.HTTP_400_BAD_REQUEST)

    user = _find_user(name)
    if not user:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    module = _find_module(module_name)
    if not module:
        return Response({"error": f"Module '{module_name}' not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        q_oid = ObjectId(question_id)
    except Exception:
        return Response({"error": "Invalid question_id."}, status=status.HTTP_400_BAD_REQUEST)

    stars_earned = calculate_stars(attempts, time_spent, hints_used)
    next_diff = difficulty

    attempts_col = get_level_attempts_collection()
    prev_best_doc = attempts_col.find_one(
        {
            "user_id":   user["_id"],
            "module_id": module["_id"],
            "level":     int(level),
        },
        sort=[("stars_earned", -1)],
    )
    previous_best_stars = prev_best_doc["stars_earned"] if prev_best_doc else 0
    delta_stars = max(0, stars_earned - previous_best_stars)

    attempts_col.insert_one({
        "user_id":      user["_id"],
        "module_id":    module["_id"],
        "level":        int(level),
        "question_id":  q_oid,
        "attempts":     attempts,
        "time_spent":   time_spent,
        "hints_used":   hints_used,
        "stars_earned": stars_earned,
        "user_answer":  user_answer,
        "difficulty":   difficulty,
        "created_at":   datetime.utcnow(),
    })

    return Response(
        {
            "stars_earned":        stars_earned,
            "next_difficulty":     next_diff,
            "delta_stars":         delta_stars,
            "previous_best_stars": previous_best_stars,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def get_level_stars(request):
    """
    GET /api/math/level-stars/?name=Alice&module=addition
    """
    name        = request.query_params.get("name", "").strip()
    module_name = request.query_params.get("module", "").strip().lower()

    if not name or not module_name:
        return Response({"error": "name and module are required."}, status=status.HTTP_400_BAD_REQUEST)

    user = _find_user(name)
    if not user:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    module = _find_module(module_name)
    if not module:
        return Response({"error": f"Module '{module_name}' not found."}, status=status.HTTP_404_NOT_FOUND)

    attempts_col = get_level_attempts_collection()

    pipeline = [
        {"$match": {"user_id": user["_id"], "module_id": module["_id"]}},
        {"$sort": {"stars_earned": -1, "created_at": 1}},
        {"$group": {
            "_id":          "$level",
            "best_stars":   {"$first": "$stars_earned"},
            "question_id":  {"$first": "$question_id"},
            "difficulty":   {"$first": "$difficulty"},
        }},
        {"$project": {
            "_id":         0,
            "level":       "$_id",
            "best_stars":  1,
            "question_id": {"$toString": "$question_id"},
            "difficulty":  1,
        }},
        {"$sort": {"level": 1}},
    ]

    results = list(attempts_col.aggregate(pipeline))
    return Response({"levels": results}, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_level_question(request):
    """
    GET /api/math/level-question/?name=Alice&module=addition&level=1

    Returns the question_id and difficulty from the user's FIRST attempt at
    this level — but only if that question still exists in the questions
    collection.  If all previously-played questions have since been deleted,
    returns { question_id: null, difficulty: null } so the frontend falls back
    to fetching a fresh question.

    This is the single source of truth for "revisit same question" behaviour.
    The check happens server-side so the frontend never receives a dead ID.
    """
    name        = request.query_params.get("name", "").strip()
    module_name = request.query_params.get("module", "").strip().lower()
    level       = request.query_params.get("level")

    if not name or not module_name or level is None:
        return Response(
            {"error": "name, module, and level are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = _find_user(name)
    if not user:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    module = _find_module(module_name)
    if not module:
        return Response({"error": f"Module '{module_name}' not found."}, status=status.HTTP_404_NOT_FOUND)

    attempts_col  = get_level_attempts_collection()
    questions_col = get_questions_collection()

    # Fetch all attempts for this user/module/level, oldest first.
    # Walk through them and return the first whose question still exists.
    past_attempts = list(attempts_col.find(
        {
            "user_id":   user["_id"],
            "module_id": module["_id"],
            "level":     int(level),
        },
        sort=[("created_at", 1)],   # chronological — first play comes first
    ))

    if not past_attempts:
        # Level has never been played
        return Response(
            {"question_id": None, "difficulty": None},
            status=status.HTTP_200_OK,
        )

    for attempt in past_attempts:
        q_id = attempt.get("question_id")
        if not q_id:
            continue
        # Cheap existence check — only fetch _id, no full document
        if questions_col.find_one({"_id": q_id}, {"_id": 1}):
            return Response(
                {
                    "question_id": str(q_id),
                    "difficulty":  attempt.get("difficulty", "easy-basic"),
                },
                status=status.HTTP_200_OK,
            )

    # Every question this user played at this level has been deleted
    return Response(
        {"question_id": None, "difficulty": None},
        status=status.HTTP_200_OK,
    )

@api_view(["POST"])
def predict_difficulty(request):

    sequence = request.data.get("sequence", [])

    # fallback
    if len(sequence) < 3:

        return Response({
            "difficulty": "easy-basic"
        })

    try:

        difficulty = predict_next_difficulty(sequence)

        return Response({
            "difficulty": difficulty
        })

    except Exception as e:

        return Response({

            "difficulty": "easy-basic",

            "error": str(e)
        })