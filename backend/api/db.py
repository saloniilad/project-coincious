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