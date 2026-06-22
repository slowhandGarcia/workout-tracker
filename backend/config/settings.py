"""
Django settings for the Workout Tracker backend.

Environment variables (see .env.example):
    SECRET_KEY, DEBUG, ALLOWED_HOSTS, DATABASE_URL, CORS_ALLOWED_ORIGINS
"""

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-change-me-in-production")
DEBUG = os.environ.get("DEBUG", "True") == "True"

ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h
]
# Railway serves the app behind a *.up.railway.app domain — allow it
# automatically when the platform injects this variable.
railway_domain = os.environ.get("RAILWAY_PUBLIC_DOMAIN")
if railway_domain:
    ALLOWED_HOSTS.append(railway_domain)

# In DEBUG, a physical phone on Expo Go hits this server via your computer's
# LAN IP (e.g. 192.168.x.x), which Django would otherwise reject with
# DisallowedHost since that IP isn't in the list above. "*" is only safe
# because it's gated behind DEBUG — production (DEBUG=False) still uses the
# explicit ALLOWED_HOSTS/RAILWAY_PUBLIC_DOMAIN values from above.
if DEBUG:
    ALLOWED_HOSTS = ["*"]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "accounts",
    "workouts",
    "social",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# Falls back to local SQLite when DATABASE_URL isn't set (e.g. local dev).
# Railway injects DATABASE_URL automatically when a Postgres plugin is attached.

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
    )
}


AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internationalization

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# Static files — served by whitenoise so no separate static host is needed on Railway.

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Django REST Framework

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticatedOrReadOnly",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}


# CORS — the Expo app calls this API from a different origin in dev (and
# from the device itself in production), so explicit origins are required.
# http://localhost:19006 is the Expo web/dev default; override via env for
# anything else (LAN IP for physical devices, production app origin, etc).
#
# In DEBUG, allow every origin unconditionally — Expo Go on a physical
# device, the iOS simulator, Android emulator, and the web target can all
# send different/missing Origin headers, and locking that down during local
# development isn't worth the friction. CORS_ALLOWED_ORIGINS below is what
# actually takes effect once DEBUG=False (production on Railway).

CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:19006").split(",")
    if o
]
CORS_ALLOW_ALL_ORIGINS = DEBUG
