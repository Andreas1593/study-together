"""
Django settings for finalproject project.

Generated by 'django-admin startproject' using Django 3.2.6.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.2/ref/settings/
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

PWA_SERVICE_WORKER_PATH = os.path.join(BASE_DIR, 'study/static/pwa', 'serviceworker.js')

PWA_APP_NAME = "Study together!"

PWA_APP_DESCRIPTION = "A learning app"

PWA_APP_ICONS = [
  {
    "src": "/static/icons/manifest-icon-192.maskable.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/static/icons/manifest-icon-192.maskable.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "maskable"
  },
  {
    "src": "/static/icons/manifest-icon-512.maskable.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/static/icons/manifest-icon-512.maskable.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "maskable"
  }
]


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-5=4of$t&2_h77q3kf6(1ykjg#g-g6d_pj&21(wg5l=*rp6)x-d'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Fix 'MIME type' error when importing js modules
if DEBUG:
    import mimetypes
    mimetypes.add_type("application/javascript", ".js", True)
    
ALLOWED_HOSTS = []

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'study',
    'pwa',
]

MIDDLEWARE = [
    'whitenoise.middleware.WhiteNoiseMiddleware', # First in list
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'finalproject.urls'

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

WSGI_APPLICATION = 'finalproject.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases

DATABASES = {

    'local': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'studytogether',
        'USER': 'Andi',
        'PASSWORD': 'admin',
        'HOST': 'localhost',
        'PORT': '5432',
    },
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'postgresql-concentric-66000',
        'USER': 'dsbygtddcvwckx',
        'PASSWORD': '26fa7550bc6c9568a3f38b22d950d6e5e99b7f88c40c661b380b89f5af4c74e1',
        'HOST': 'ec2-34-195-69-118.compute-1.amazonaws.com',
        'PORT': '5432',
    },
    'notdefault': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    },
}


# Password validation
# https://docs.djangoproject.com/en/3.2/ref/settings/#auth-password-validators

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

AUTH_USER_MODEL = 'study.User'

# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.2/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

# Default primary key field type
# https://docs.djangoproject.com/en/3.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# import django_heroku
# django_heroku.settings(locals(), staticfiles=False, allowed_hosts=False)

if "DYNO" in os.environ:
    STATIC_ROOT = 'static'
    ALLOWED_HOSTS = ['studytogetherapp.herokuapp.com']
    DEBUG = False