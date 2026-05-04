"""
Production settings — replace your settings.py content with this
when deploying to Render, or import it conditionally.
"""

from dotenv import load_dotenv
load_dotenv()
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# ------------------------------------------------------------------ #
#  SECURITY                                                           #
# ------------------------------------------------------------------ #
SECRET_KEY = os.environ.get('SECRET_KEY')          # Set in Render dashboard
DEBUG = os.environ.get('DEBUG', 'False') == 'True' # Keep False in production

ALLOWED_HOSTS = [
    os.environ.get('RENDER_EXTERNAL_HOSTNAME', ''),  # Auto-set by Render
    'localhost',
    '127.0.0.1',
]

# ------------------------------------------------------------------ #
#  APPS & MIDDLEWARE                                                  #
# ------------------------------------------------------------------ #
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',   # serves static files on Render
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# ------------------------------------------------------------------ #
#  MONGODB                                                            #
# ------------------------------------------------------------------ #
MONGO_URI    = os.environ.get('MONGO_URI')
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'coincious_db')

# ------------------------------------------------------------------ #
#  EMAIL                                                              #
# ------------------------------------------------------------------ #
EMAIL_BACKEND      = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST         = 'smtp.gmail.com'
EMAIL_PORT         = 587
EMAIL_USE_TLS      = True
EMAIL_HOST_USER    = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# ------------------------------------------------------------------ #
#  CORS  — replace * with your actual Vercel URL after deployment     #
# ------------------------------------------------------------------ #
CORS_ALLOWED_ORIGINS = [
    os.environ.get('FRONTEND_URL', 'http://localhost:5173'),
]
CORS_ALLOW_CREDENTIALS = True

# ------------------------------------------------------------------ #
#  STATIC FILES                                                       #
# ------------------------------------------------------------------ #
STATIC_URL  = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')   # collectstatic output
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ------------------------------------------------------------------ #
#  MISC                                                               #
# ------------------------------------------------------------------ #
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
}