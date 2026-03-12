import hashlib
from datetime import datetime, timedelta
import secrets
import re
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.http import require_GET
# AFTER
from .db import get_users_collection, get_currency_collection, get_progress_collection, get_otp_collection, get_identification_attempts_collection


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def is_valid_email(email: str) -> bool:
    return bool(re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email))


@api_view(['POST'])
def signup(request):
    """
    POST /api/signup/
    Body: { "name": "...", "email": "...", "password": "..." }
    """
    data = request.data
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return Response({'error': 'Name, email, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not is_valid_email(email):
        return Response({'error': 'Invalid email format.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(password) < 6:
        return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    users = get_users_collection()

    if users.find_one({'email': email}):
        return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_409_CONFLICT)

    users.insert_one({
        'name': name,
        'email': email,
        'password': hash_password(password),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    })

    return Response({'message': f'Account created successfully! Welcome, {name}.'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login(request):
    """
    POST /api/login/
    Body: { "name": "...", "password": "..." }
    """
    data = request.data
    name = data.get('name', '').strip()
    password = data.get('password', '')

    if not name or not password:
        return Response({'error': 'Name and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    users = get_users_collection()
    user = users.find_one({'name': {'$regex': f'^{re.escape(name)}$', '$options': 'i'}})

    if not user or user['password'] != hash_password(password):
        return Response({'error': 'Invalid name or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    return Response({
        'message': 'Login successful!',
        'user': {
            'name': user['name'],
            'email': user['email'],
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def forgot_password(request):
    """
    POST /api/forgot-password/
    Body: { "email": "..." }
    Generates a new random password, saves it, and emails it to the user.
    """
    data = request.data
    email = data.get('email', '').strip().lower()

    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    users = get_users_collection()
    user = users.find_one({'email': email})

    # Always return success to avoid email enumeration
    if not user:
        return Response({'message': 'If an account with this email exists, a new password has been sent.'}, status=status.HTTP_200_OK)

    # Generate a new random password
    new_password = secrets.token_urlsafe(10)

    users.update_one(
        {'email': email},
        {
            '$set': {
                'password': hash_password(new_password),
                'updated_at': datetime.utcnow()
            }
        }
    )

    # Send email
    try:
        send_mail(
            subject='Coincious - Your New Password',
            message=f"""Hi {user['name']},

You requested a password reset for your Coincious account.

Your new temporary password is:

    {new_password}

Please log in and change your password after signing in.

If you did not request this, please contact support immediately.

– The Coincious Team
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'message': 'A new password has been sent to your email address.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_profile(request):
    """
    GET /api/profile/?name=...
    Returns the user's profile info (name + email).
    """
    name = request.query_params.get('name', '').strip()

    if not name:
        return Response({'error': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)

    users = get_users_collection()
    user = users.find_one({'name': {'$regex': f'^{re.escape(name)}$', '$options': 'i'}})

    if not user:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'name': user['name'],
        'email': user['email'],
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def save_progress(request):
    """
    POST /api/progress/save/
    Body: { "name": "...", "progress": { "addition_level_1_stars": 3, ... } }
    Upserts the full progress map for a user.
    """
    data = request.data
    name = data.get('name', '').strip()
    progress = data.get('progress', {})

    if not name:
        return Response({'error': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not isinstance(progress, dict):
        return Response({'error': 'Progress must be an object.'}, status=status.HTTP_400_BAD_REQUEST)

    collection = get_progress_collection()
    collection.update_one(
        {'name': name},
        {'$set': {'name': name, 'progress': progress}},
        upsert=True
    )

    return Response({'message': 'Progress saved successfully.'}, status=status.HTTP_200_OK)
@api_view(['POST'])
def update_level_progress(request):
    """
    POST /api/progress/update/

    Body:
    {
        "name": "user",
        "module": "addition",
        "level": 1,
        "stars": 3
    }
    """

    name = request.data.get("name", "").strip()
    module = request.data.get("module", "").strip().lower()
    level = request.data.get("level")
    stars = request.data.get("stars")

    if not name or not module or level is None or stars is None:
        return Response(
            {"error": "name, module, level and stars are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        level = int(level)
        stars = int(stars)
    except ValueError:
        return Response(
            {"error": "level and stars must be integers"},
            status=status.HTTP_400_BAD_REQUEST
        )

    key = f"{module}_level_{level}_stars"

    progress_col = get_progress_collection()

    progress_col.update_one(
        {"name": name},
        {
            "$set": {
                f"progress.{key}": stars,
                "name": name
            }
        },
        upsert=True
    )

    return Response(
        {"message": "Progress updated successfully"},
        status=status.HTTP_200_OK
    )

@api_view(['GET'])
def load_progress(request):
    """
    GET /api/progress/load/?name=...
    Returns the stored progress map for a user.
    """
    name = request.query_params.get('name', '').strip()

    if not name:
        return Response({'error': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)

    collection = get_progress_collection()
    doc = collection.find_one({'name': name})

    if not doc:
        return Response({'progress': {}}, status=status.HTTP_200_OK)

    return Response({'progress': doc.get('progress', {})}, status=status.HTTP_200_OK)


# ── OTP-based password change ─────────────────────────────────────────────────

OTP_EXPIRY_MINUTES = 10


@api_view(['POST'])
def send_change_password_otp(request):
    """
    POST /api/change-password/send-otp/
    Body: { "name": "..." }
    Looks up the user's email by name, generates a 6-digit OTP,
    stores it in MongoDB with a 10-minute expiry, and emails it.
    """
    data = request.data
    name = data.get('name', '').strip()

    if not name:
        return Response({'error': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)

    users = get_users_collection()
    user = users.find_one({'name': {'$regex': f'^{re.escape(name)}$', '$options': 'i'}})

    if not user:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    email = user['email']

    # Generate a 6-digit OTP
    otp = str(secrets.randbelow(900000) + 100000)
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # Upsert OTP record (one active OTP per user at a time)
    otp_col = get_otp_collection()
    otp_col.update_one(
        {'name': name},
        {'$set': {'name': name, 'email': email, 'otp': otp, 'expires_at': expires_at, 'verified': False}},
        upsert=True
    )

    # Send email
    try:
        send_mail(
            subject='Coincious - Your Password Change OTP',
            message=f"""Hi {user['name']},

You requested to change your Coincious account password.

Your one-time verification code is:

    {otp}

This code expires in {OTP_EXPIRY_MINUTES} minutes.

If you did not request this, please ignore this email.

– The Coincious Team
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        return Response({'error': f'Failed to send OTP email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Return masked email so the frontend can show "sent to j***@gmail.com"
    local, domain = email.split('@', 1)
    masked = local[0] + ('*' * max(1, len(local) - 2)) + local[-1] + '@' + domain

    return Response({
        'message': f'OTP sent to {masked}.',
        'masked_email': masked,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def verify_otp_and_change_password(request):
    """
    POST /api/change-password/verify/
    Body: { "name": "...", "otp": "...", "new_password": "..." }
    Verifies the OTP and, if valid, updates the user's password.
    """
    data = request.data
    name = data.get('name', '').strip()
    otp_input = data.get('otp', '').strip()
    new_password = data.get('new_password', '')

    if not name or not otp_input or not new_password:
        return Response({'error': 'Name, OTP, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 6:
        return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    otp_col = get_otp_collection()
    record = otp_col.find_one({'name': name})

    if not record:
        return Response({'error': 'No OTP found. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    if datetime.utcnow() > record['expires_at']:
        otp_col.delete_one({'name': name})
        return Response({'error': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    if record['otp'] != otp_input:
        return Response({'error': 'Incorrect OTP. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

    # OTP is valid — update password and remove OTP record
    users = get_users_collection()
    users.update_one(
        {'name': {'$regex': f'^{re.escape(name)}$', '$options': 'i'}},
        {'$set': {'password': hash_password(new_password), 'updated_at': datetime.utcnow()}}
    )
    otp_col.delete_one({'name': name})

    return Response({'message': 'Password changed successfully!'}, status=status.HTTP_200_OK)


# ── Identification Game ───────────────────────────────────────────────────────

from bson import ObjectId

@api_view(['POST'])
def save_identification_attempt(request):
    """
    POST /api/identification/attempt/
    Body: {
        "name": "...",
        "currency_value": 10,
        "currency_type": "coin",
        "selected_jar_value": 20,
        "is_correct": false
    }
    Looks up the real currency ObjectId, then saves the attempt.
    """
    data = request.data
    name             = data.get('name', '').strip()
    currency_value   = data.get('currency_value')
    currency_type    = data.get('currency_type', '').strip().lower()
    selected_jar_value = data.get('selected_jar_value')
    is_correct       = data.get('is_correct')

    if not name or currency_value is None or not currency_type or selected_jar_value is None or is_correct is None:
        return Response(
            {'error': 'name, currency_value, currency_type, selected_jar_value, and is_correct are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Resolve user
    users = get_users_collection()
    user = users.find_one({'name': {'$regex': f'^{re.escape(name)}$', '$options': 'i'}})
    if not user:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Resolve currency — matches the seeded documents exactly
    currency_col = get_currency_collection()
    currency = currency_col.find_one({'value': int(currency_value), 'type': currency_type})
    if not currency:
        return Response({'error': f'Currency {currency_value} {currency_type} not found.'}, status=status.HTTP_404_NOT_FOUND)

    attempts_col = get_identification_attempts_collection()
    attempts_col.insert_one({
        'user_id':            user['_id'],        # ObjectId FK → users
        'currency_id':        currency['_id'],    # ObjectId FK → currency
        'selected_jar_value': int(selected_jar_value),
        'is_correct':         bool(is_correct),
        'attempts_count':     1,
        'created_at':         datetime.utcnow(),
    })

    return Response({'message': 'Attempt saved.'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def get_identification_stats(request):
    """
    GET /api/identification/stats/?name=...
    Returns per-currency stats (with value + type resolved) and overall totals.
    """
    name = request.query_params.get('name', '').strip()
    if not name:
        return Response({'error': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)

    users = get_users_collection()
    user = users.find_one({'name': {'$regex': f'^{re.escape(name)}$', '$options': 'i'}})
    if not user:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    attempts_col = get_identification_attempts_collection()

    pipeline = [
        {'$match': {'user_id': user['_id']}},

        # Group by currency_id
        {'$group': {
            '_id':              '$currency_id',
            'total_attempts':   {'$sum': 1},
            'correct_attempts': {'$sum': {'$cond': ['$is_correct', 1, 0]}},
        }},

        # Join currency collection to get value + type
        {'$lookup': {
            'from':         'currency',
            'localField':   '_id',
            'foreignField': '_id',
            'as':           'currency_info',
        }},
        {'$unwind': {'path': '$currency_info', 'preserveNullAndEmptyArrays': True}},

        {'$project': {
            'currency_id':      {'$toString': '$_id'},
            'value':            '$currency_info.value',
            'type':             '$currency_info.type',
            'total_attempts':   1,
            'correct_attempts': 1,
            'accuracy': {
                '$cond': [
                    {'$eq': ['$total_attempts', 0]}, 0,
                    {'$multiply': [
                        {'$divide': ['$correct_attempts', '$total_attempts']}, 100
                    ]}
                ]
            },
            '_id': 0,
        }}
    ]

    per_currency = list(attempts_col.aggregate(pipeline))

    total   = sum(c['total_attempts']   for c in per_currency)
    correct = sum(c['correct_attempts'] for c in per_currency)

    return Response({
        'per_currency': per_currency,
        'overall': {
            'total_attempts':   total,
            'correct_attempts': correct,
            'accuracy':         round((correct / total * 100) if total else 0, 1),
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_identification_history(request):
    """
    GET /api/identification/history/?name=...&limit=20
    Returns recent attempts with currency value + type resolved via $lookup.
    """
    name  = request.query_params.get('name', '').strip()
    limit = int(request.query_params.get('limit', 20))

    if not name:
        return Response({'error': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)

    users = get_users_collection()
    user = users.find_one({'name': {'$regex': f'^{re.escape(name)}$', '$options': 'i'}})
    if not user:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    attempts_col = get_identification_attempts_collection()

    pipeline = [
        {'$match': {'user_id': user['_id']}},
        {'$sort':  {'created_at': -1}},
        {'$limit': limit},

        # Resolve currency details
        {'$lookup': {
            'from':         'currency',
            'localField':   'currency_id',
            'foreignField': '_id',
            'as':           'currency_info',
        }},
        {'$unwind': {'path': '$currency_info', 'preserveNullAndEmptyArrays': True}},

        {'$project': {
            '_id':                0,
            'currency_value':     '$currency_info.value',
            'currency_type':      '$currency_info.type',
            'selected_jar_value': 1,
            'is_correct':         1,
            'created_at':         1,
        }}
    ]

    docs = list(attempts_col.aggregate(pipeline))
    for d in docs:
        d['created_at'] = d['created_at'].isoformat()

    return Response({'history': docs}, status=status.HTTP_200_OK)



@require_GET
def get_currencies_by_ids(request):
    ids_param = request.GET.get("ids", "")
    if not ids_param:
        return JsonResponse({"currencies": []})
    
    try:
        object_ids = [ObjectId(i.strip()) for i in ids_param.split(",") if i.strip()]
    except Exception:
        return JsonResponse({"error": "Invalid ID format"}, status=400)

    col = get_currency_collection()
    docs = list(col.find({"_id": {"$in": object_ids}}))

    currencies = []
    for doc in docs:
        versions = doc.get("versions", [])
        front_image = versions[0]["front_image"] if versions else None
        currencies.append({
            "id":          str(doc["_id"]),
            "type":        doc.get("type"),
            "value":       doc.get("value"),
            "front_image": front_image,
        })

    return JsonResponse({"currencies": currencies})