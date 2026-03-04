from pymongo import MongoClient
from django.conf import settings

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        _client = MongoClient(settings.MONGO_URI)
        _db = _client[settings.MONGO_DB_NAME]
    return _db


def get_users_collection():
    return get_db()['users']

def get_currency_collection():
    return get_db()['currency']

def get_progress_collection():
    return get_db()['progress']

def get_otp_collection():
    return get_db()['otps']

def get_modules_collection():
    return get_db()["modules"]

def get_identification_attempts_collection():
    return get_db()['identification_attempts']

def get_items_collection():
    return get_db()['items']

def get_questions_collection():
    return get_db()["questions"]

def get_level_attempts_collection():
    """
    level_attempts table (from schema diagram):
      i.    attempt_id   → ObjectId  (PK, auto _id)
      ii.   user_id      → ObjectId  (FK → users)
      iii.  module_id    → ObjectId  (FK → modules)
      iv.   question_id  → ObjectId  (FK → questions)
      v.    attempts     → Number
      vi.   time_spent   → Number    (seconds)
      vii.  hints_used   → Number
      viii. stars_earned → Number
      ix.   user_answer  → Number
      x.    created_at   → Date
    """
    return get_db()["level_attempts"]