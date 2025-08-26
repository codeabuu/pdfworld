from decouple import config
from pathlib import Path
import os
from supabase import create_client, Client

BASE_DIR = Path(__file__).resolve().parent.parent
DOWNLOAD_DIR = os.path.join(BASE_DIR, 'download_temp')
SECRET_KEY = config('DJANGO_SECRET_KEY')

DEBUG = config('DJANGO_DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "192.168.0.101"]

# CORS Configuration - FIX THESE:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",    # Your frontend origin
    "http://127.0.0.1:8080",    # Alternative frontend origin
    "http://localhost:3000",    # Common React dev server port
]

CORS_ALLOW_CREDENTIALS = True  # ← ADD THIS LINE (CRITICAL!)

CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'x-csrftoken',
    'x-requested-with',
]

# CSRF Configuration - ADD THIS:
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
]

# For session cookies
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True  # Set to True in production with HTTPS
SESSION_COOKIE_SECURE = True 

# For CSRF cookies
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript to read CSRF token
CSRF_USE_SESSIONS = False
CSRF_COOKIE_SECURE = True

API_BASE_URL = config('API_BASE_URL')
REQUEST_TIMEOUT = 10
SCRAPE_CACHE_TIMEOUT = 60 * 60 * 4

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',  # Make sure this is included
    'scraper',
    'customers',
]

# MIDDLEWARE - MOVE CORS MIDDLEWARE TO TOP
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ← SHOULD BE AT THE TOP
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ... rest of your settings remain the same ...
ROOT_URLCONF = 'bookhub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'bookhub.wsgi.application'

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
SUPABASE_DB_URL = config('SUPABASE_DB_URL', default=None)

import dj_database_url

if SUPABASE_DB_URL:
    # Use Supabase PostgreSQL database
    DATABASES = {
        'default': dj_database_url.config(
            default=SUPABASE_DB_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True
        )
    }
else:
    # Fall back to SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

DATABASE_URL = config('SUPABASE_DB_URL', default=None)
if DATABASE_URL is not None:
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=50, conn_health_checks=True, ssl_require=True)
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SUPABASE_URL = config("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = config("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = config("SUPABASE_JWT_SECRET")
SUPABASE_ANON_KEY = config("SUPABASE_ANON_KEY")
_supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
SUPABASE_CLIENT = _supabase