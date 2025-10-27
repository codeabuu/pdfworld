from decouple import config
from pathlib import Path
import os
from supabase import create_client, Client

BASE_DIR = Path(__file__).resolve().parent.parent
DOWNLOAD_DIR = os.path.join(BASE_DIR, 'download_temp')
SECRET_KEY = config('DJANGO_SECRET_KEY')
REDIS_URL = config('REDIS_URL', default=None)

PAYSTACK_SECRET_KEY = config('PAYSTACK_SECRET_KEY')
PAYSTACK_PUBLIC_KEY = config('PAYSTACK_PUBLIC_KEY')

FRONTEND_URL = "http://127.0.0.1:8080"
BACKEND_URL = config('BACKEND_URL')

PAYSTACK_PLAN_CODES = {
    "monthly": config("MONTHLY_PLAN"),
    "yearly": config("YEARLY_PLAN"),
}

DEBUG = config('DJANGO_DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "192.168.0.101", "11259e8dc948.ngrok-free.app", "bookhub-bold-dew-7754.fly.dev", ".fly.dev"]

# CORS Configuration - FIX THESE:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",    # Your frontend origin
    "http://127.0.0.1:8080",    # Alternative frontend origin
    "http://localhost:3000",
    "http://127.0.0.1:6379",
    f"https://{BACKEND_URL}",
    REDIS_URL
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'x-csrftoken',
    'x-requested-with',
]

LIVE_URL = config('LIVE_URL', default=None)

# CSRF Configuration - ADD THIS:
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    "http://127.0.0.1:6379",
    LIVE_URL,
    f"https://{BACKEND_URL}",
    REDIS_URL,
]

# For session cookies
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_SAVE_EVERY_REQUEST = True
SESSION_COOKIE_NAME = 'sessionid'

# For CSRF cookies
CSRF_COOKIE_SAMESITE = 'Lax'
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
    'corsheaders', 
    'scraper',
    'customers',
    'subscriptions',
    'django_crontab',
    'django_ratelimit',
    'supabase_auth',
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

CRONJOBS = [
    ('0 0 * * *', 'django.core.management.call_command', ['handle_expired_trials']),
]

WSGI_APPLICATION = 'bookhub.wsgi.application'


SUPABASE_DB_URL = config('SUPABASE_DB_URL', default=None)

import dj_database_url

if SUPABASE_DB_URL:
    print("🟢 FORCING SUPABASE CONFIGURATION")
    # Parse the Supabase URL manually to ensure it's used
    import urllib.parse
    url = urllib.parse.urlparse(SUPABASE_DB_URL)
    
    # EXPLICIT CONFIGURATION - don't use dj_database_url.config()
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:] if url.path.startswith('/') else url.path,  # Remove leading slash
            'USER': url.username,
            'PASSWORD': url.password,
            'HOST': url.hostname,
            'PORT': url.port or 6543,  # Use 6543 for pooler
            'CONN_MAX_AGE': 300,
            'OPTIONS': {
                'connect_timeout': 10,
                'sslmode': 'require',
                'keepalives': 1,
                'keepalives_idle': 30,
                'keepalives_interval': 10,
            },
        }
    }
    
    print(f"🟢 Using Supabase: {url.hostname}:{url.port}")
else:
    print("🔴 SUPABASE_DB_URL not set")
    # Fall back to SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# DEBUG: Print final database config
print("=== FINAL DATABASE CONFIG ===")
print("ENGINE:", DATABASES['default']['ENGINE'])
print("HOST:", DATABASES['default'].get('HOST', 'Not set'))
print("PORT:", DATABASES['default'].get('PORT', 'Not set'))

# DATABASE_URL = config('SUPABASE_DB_URL', default=None)
# if DATABASE_URL is not None:
#     DATABASES = {
#         'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=0, conn_health_checks=True, ssl_require=True)
#     }

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

import socket
RUNNING_LOCALLY = socket.gethostname() == "127.0.0.1:8000" or "fly.io" not in os.getenv("FLY_APP_NAME", "")

# if not RUNNING_LOCALLY:
    # Use Redis in production (Fly.io)
CACHES = {
"default": {
    "BACKEND": "django_redis.cache.RedisCache",
    "LOCATION": REDIS_URL,
    "OPTIONS": {
        "CLIENT_CLASS": "django_redis.client.DefaultClient",
        "SSL": True,
        "ssl_cert_reqs": None,
    },
}
}
print(f"🟢 Using Redis: {REDIS_URL}")
# else:
#     # Use local Redis when running locally
#     CACHES = {
#         "default": {
#             "BACKEND": "django_redis.cache.RedisCache",
#             "LOCATION": "redis://127.0.0.1:6379/1",
#             "OPTIONS": {
#                 "CLIENT_CLASS": "django_redis.client.DefaultClient",
#             },
#         }
#     }
#     print("🟡 Using local Redis")