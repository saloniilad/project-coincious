import hashlib
import secrets
import re
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .db import get_users_collection, get_progress_collection


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
        {'$set': {'password': hash_password(new_password)}}
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