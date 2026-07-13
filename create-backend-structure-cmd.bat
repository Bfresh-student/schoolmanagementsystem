@echo off
REM ========================================
REM Script CMD - Création structure BACKEND
REM Django REST Framework + Celery + Channels
REM ========================================

setlocal enabledelayedexpansion
set "ProjectDir=backend"

echo.
echo ============================================
echo Creation structure: BACKEND Django
echo ============================================
echo.

if not exist "%ProjectDir%" (
    mkdir "%ProjectDir%"
    echo [OK] Repertoire racine cree: %ProjectDir%
)

cd /d "%ProjectDir%"

REM ========== DOSSIERS PRINCIPAUX ==========
echo.
echo --- Creation des dossiers principaux ---

for %%d in (config apps core static media locale tests requirements) do (
    if not exist "%%d" (
        mkdir "%%d"
        echo [OK] Repertoire cree: %%d
    )
)

REM ========== CONFIG ==========
echo.
echo --- Creation dossier config ---

if not exist "config\settings" mkdir "config\settings"
echo [OK] Repertoire cree: config\settings

REM Fichiers vides
type nul > "config\__init__.py"
type nul > "config\settings\__init__.py"

REM config/settings/base.py
(
    echo import os
    echo from pathlib import Path
    echo.
    echo BASE_DIR = Path^(__file__^).resolve^(^).parent.parent.parent
    echo.
    echo SECRET_KEY = os.environ.get^('SECRET_KEY', 'dev-key-change-in-production'^)
    echo DEBUG = False
    echo.
    echo ALLOWED_HOSTS = os.environ.get^('ALLOWED_HOSTS', 'localhost,127.0.0.1'^).split^(','
    echo.
    echo INSTALLED_APPS = [
    echo     'daphne',
    echo     'django.contrib.admin',
    echo     'django.contrib.auth',
    echo     'django.contrib.contenttypes',
    echo     'django.contrib.sessions',
    echo     'django.contrib.messages',
    echo     'django.contrib.staticfiles',
    echo.
    echo     'rest_framework',
    echo     'corsheaders',
    echo     'django_filters',
    echo     'django_extensions',
    echo.
    echo     'apps.users',
    echo     'apps.students',
    echo     'apps.teachers',
    echo     'apps.hr',
    echo     'apps.courses',
    echo     'apps.enrollments',
    echo     'apps.grades',
    echo     'apps.attendances',
    echo     'apps.projects',
    echo     'apps.events',
    echo     'apps.finance',
    echo     'apps.payments',
    echo     'apps.media_center',
    echo     'apps.notifications',
    echo     'apps.ai_insights',
    echo     'apps.sync',
    echo ]
    echo.
    echo MIDDLEWARE = [
    echo     'django.middleware.security.SecurityMiddleware',
    echo     'django.contrib.sessions.middleware.SessionMiddleware',
    echo     'corsheaders.middleware.CorsMiddleware',
    echo     'django.middleware.common.CommonMiddleware',
    echo     'django.middleware.csrf.CsrfViewMiddleware',
    echo     'django.contrib.auth.middleware.AuthenticationMiddleware',
    echo     'django.contrib.messages.middleware.MessageMiddleware',
    echo     'django.middleware.clickjacking.XFrameOptionsMiddleware',
    echo     'core.middleware.audit_log.AuditLogMiddleware',
    echo     'core.middleware.request_id.RequestIdMiddleware',
    echo ]
    echo.
    echo ROOT_URLCONF = 'config.urls'
    echo WSGI_APPLICATION = 'config.wsgi.application'
    echo ASGI_APPLICATION = 'config.asgi.application'
    echo.
    echo DATABASES = {
    echo     'default': {
    echo         'ENGINE': 'django.db.backends.postgresql',
    echo         'NAME': os.environ.get^('DB_NAME', 'gestion_scolaire'^),
    echo         'USER': os.environ.get^('DB_USER', 'postgres'^),
    echo         'PASSWORD': os.environ.get^('DB_PASSWORD', 'password'^),
    echo         'HOST': os.environ.get^('DB_HOST', 'localhost'^),
    echo         'PORT': os.environ.get^('DB_PORT', '5432'^),
    echo     }
    echo }
    echo.
    echo LANGUAGE_CODE = 'fr'
    echo TIME_ZONE = 'America/Port-au-Prince'
    echo USE_I18N = True
    echo USE_TZ = True
    echo.
    echo STATIC_URL = '/static/'
    echo STATIC_ROOT = BASE_DIR / 'staticfiles'
    echo MEDIA_URL = '/media/'
    echo MEDIA_ROOT = BASE_DIR / 'media'
) > "config\settings\base.py"
echo [OK] Fichier cree: config/settings/base.py

REM config/settings/local.py
(
    echo from .base import *
    echo.
    echo DEBUG = True
    echo.
    echo DATABASES = {
    echo     'default': {
    echo         'ENGINE': 'django.db.backends.sqlite3',
    echo         'NAME': BASE_DIR / 'db.sqlite3',
    echo     }
    echo }
    echo.
    echo INSTALLED_APPS += [
    echo     'debug_toolbar',
    echo     'django_extensions',
    echo ]
    echo.
    echo MIDDLEWARE += [
    echo     'debug_toolbar.middleware.DebugToolbarMiddleware',
    echo ]
) > "config\settings\local.py"
echo [OK] Fichier cree: config/settings/local.py

REM config/settings/production.py
(
    echo from .base import *
    echo.
    echo DEBUG = False
    echo.
    echo SECURE_SSL_REDIRECT = True
    echo SESSION_COOKIE_SECURE = True
    echo CSRF_COOKIE_SECURE = True
    echo SECURE_HSTS_SECONDS = 31536000
    echo SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    echo SECURE_HSTS_PRELOAD = True
) > "config\settings\production.py"
echo [OK] Fichier cree: config/settings/production.py

REM config/settings/test.py
(
    echo from .base import *
    echo.
    echo DEBUG = False
    echo.
    echo DATABASES = {
    echo     'default': {
    echo         'ENGINE': 'django.db.backends.sqlite3',
    echo         'NAME': ':memory:',
    echo     }
    echo }
) > "config\settings\test.py"
echo [OK] Fichier cree: config/settings/test.py

REM config/urls.py
(
    echo from django.contrib import admin
    echo from django.urls import path, include
    echo from django.conf import settings
    echo from django.conf.urls.static import static
    echo.
    echo urlpatterns = [
    echo     path^('admin/', admin.site.urls^),
    echo     path^('api/v1/auth/', include^('apps.users.urls'^)^),
    echo ]
) > "config\urls.py"
echo [OK] Fichier cree: config/urls.py

REM config/wsgi.py
(
    echo import os
    echo from django.core.wsgi import get_wsgi_application
    echo.
    echo os.environ.setdefault^('DJANGO_SETTINGS_MODULE', 'config.settings.production'^)
    echo application = get_wsgi_application^(^)
) > "config\wsgi.py"
echo [OK] Fichier cree: config/wsgi.py

REM config/asgi.py
(
    echo import os
    echo from django.core.asgi import get_asgi_application
    echo.
    echo os.environ.setdefault^('DJANGO_SETTINGS_MODULE', 'config.settings.production'^)
    echo application = get_asgi_application^(^)
) > "config\asgi.py"
echo [OK] Fichier cree: config/asgi.py

REM config/celery.py
(
    echo import os
    echo from celery import Celery
    echo.
    echo os.environ.setdefault^('DJANGO_SETTINGS_MODULE', 'config.settings.production'^)
    echo app = Celery^('gestion_scolaire'^)
    echo app.config_from_object^('django.conf:settings', namespace='CELERY'^)
) > "config\celery.py"
echo [OK] Fichier cree: config/celery.py

REM ========== APPS ==========
echo.
echo --- Creation des 16 apps Django ---

for %%a in (users students teachers hr courses enrollments grades attendances projects events finance payments media_center notifications ai_insights sync) do (
    if not exist "apps\%%a" mkdir "apps\%%a"
    
    type nul > "apps\%%a\__init__.py"
    echo from django.db import models > "apps\%%a\models.py"
    echo from rest_framework import viewsets > "apps\%%a\views.py"
    echo from rest_framework import serializers > "apps\%%a\serializers.py"
    echo from django.urls import path, include > "apps\%%a\urls.py"
    echo from django.contrib import admin > "apps\%%a\admin.py"
    
    (
        echo from django.apps import AppConfig
        echo.
        echo class %%aConfig^(AppConfig^):
        echo     default_auto_field = 'django.db.models.BigAutoField'
        echo     name = 'apps.%%a'
    ) > "apps\%%a\apps.py"
    
    echo [OK] App creee: %%a
)

REM ========== CORE ==========
echo.
echo --- Creation dossier core ---

if not exist "core\middleware" mkdir "core\middleware"
if not exist "core\utils" mkdir "core\utils"

type nul > "core\__init__.py"
type nul > "core\middleware\__init__.py"
type nul > "core\utils\__init__.py"

(
    echo from rest_framework.permissions import BasePermission
    echo.
    echo class HasResourcePermission^(BasePermission^):
    echo     def has_permission^(self, request, view^):
    echo         return request.user and request.user.is_authenticated
) > "core\permissions.py"
echo [OK] Fichier cree: core/permissions.py

(
    echo from rest_framework.pagination import PageNumberPagination
    echo.
    echo class CustomPageNumberPagination^(PageNumberPagination^):
    echo     page_size = 20
    echo     page_size_query_param = 'page_size'
    echo     max_page_size = 100
) > "core\pagination.py"
echo [OK] Fichier cree: core/pagination.py

(
    echo from rest_framework.views import exception_handler
    echo.
    echo def custom_exception_handler^(exc, context^):
    echo     response = exception_handler^(exc, context^)
    echo     if response is not None:
    echo         response.data = {'status': 'error'}
    echo     return response
) > "core\exceptions.py"
echo [OK] Fichier cree: core/exceptions.py

(
    echo from django.db import models
    echo.
    echo class SyncableMixin^(models.Model^):
    echo     is_synced = models.BooleanField^(default=False^)
    echo     class Meta:
    echo         abstract = True
) > "core\mixins.py"
echo [OK] Fichier cree: core/mixins.py

(
    echo from django.utils.deprecation import MiddlewareMixin
    echo.
    echo class AuditLogMiddleware^(MiddlewareMixin^):
    echo     pass
) > "core\middleware\audit_log.py"
echo [OK] Fichier cree: core/middleware/audit_log.py

(
    echo import uuid
    echo from django.utils.deprecation import MiddlewareMixin
    echo.
    echo class RequestIdMiddleware^(MiddlewareMixin^):
    echo     pass
) > "core\middleware\request_id.py"
echo [OK] Fichier cree: core/middleware/request_id.py

(
    echo class ConflictResolver:
    echo     pass
) > "core\utils\conflict_resolver.py"
echo [OK] Fichier cree: core/utils/conflict_resolver.py

(
    echo class PDFGenerator:
    echo     pass
) > "core\utils\pdf_generator.py"
echo [OK] Fichier cree: core/utils/pdf_generator.py

REM ========== TESTS ==========
echo.
echo --- Creation dossier tests ---

if not exist "tests\factories" mkdir "tests\factories"
if not exist "tests\integration" mkdir "tests\integration"

type nul > "tests\__init__.py"
type nul > "tests\factories\__init__.py"
type nul > "tests\integration\__init__.py"

(
    echo import pytest
    echo.
    echo @pytest.fixture
    echo def user^(db^):
    echo     pass
) > "tests\conftest.py"
echo [OK] Fichier cree: tests/conftest.py

(
    echo import pytest
    echo.
    echo class TestEnrollmentToInvoiceFlow:
    echo     pass
) > "tests\integration\test_enrollment_to_invoice_flow.py"
echo [OK] Fichier cree: tests/integration/test_enrollment_to_invoice_flow.py

(
    echo import pytest
    echo.
    echo class TestGradeConflictResolution:
    echo     pass
) > "tests\integration\test_grade_conflict_resolution.py"
echo [OK] Fichier cree: tests/integration/test_grade_conflict_resolution.py

(
    echo import pytest
    echo.
    echo class TestOfflineSyncScenarios:
    echo     pass
) > "tests\integration\test_offline_sync_scenarios.py"
echo [OK] Fichier cree: tests/integration/test_offline_sync_scenarios.py

REM ========== REQUIREMENTS ==========
echo.
echo --- Creation requirements ---

(
    echo Django==4.2.0
    echo djangorestframework==3.14.0
    echo django-cors-headers==4.0.0
    echo django-filter==23.1
    echo channels==4.0.0
    echo channels-redis==4.1.0
    echo daphne==4.0.0
    echo celery==5.3.0
    echo redis==4.5.4
    echo psycopg2-binary==2.9.6
    echo python-dotenv==1.0.0
    echo Pillow==9.5.0
) > "requirements\base.txt"
echo [OK] Fichier cree: requirements/base.txt

(
    echo -r base.txt
    echo.
    echo django-debug-toolbar==4.0.0
    echo django-extensions==3.2.3
    echo pytest==7.3.1
    echo pytest-django==4.5.2
    echo pytest-cov==4.1.0
    echo factory-boy==3.2.1
    echo faker==18.9.0
    echo black==23.3.0
    echo flake8==6.0.0
    echo isort==5.12.0
) > "requirements\local.txt"
echo [OK] Fichier cree: requirements/local.txt

(
    echo -r base.txt
    echo.
    echo gunicorn==20.1.0
    echo sentry-sdk==1.24.0
) > "requirements\production.txt"
echo [OK] Fichier cree: requirements/production.txt

REM ========== FICHIERS RACINE ==========
echo.
echo --- Creation fichiers de configuration ---

(
    echo [pytest]
    echo DJANGO_SETTINGS_MODULE = config.settings.test
    echo python_files = tests.py test_*.py *_tests.py
) > "pytest.ini"
echo [OK] Fichier cree: pytest.ini

(
    echo [build-system]
    echo requires = ["setuptools", "wheel"]
) > "pyproject.toml"
echo [OK] Fichier cree: pyproject.toml

(
    echo [flake8]
    echo max-line-length = 100
    echo exclude = .git,__pycache__,venv,migrations
) > ".flake8"
echo [OK] Fichier cree: .flake8

(
    echo #!/usr/bin/env python
    echo import os
    echo import sys
    echo from django.core.management import execute_from_command_line
    echo.
    echo if __name__ == '__main__':
    echo     os.environ.setdefault^('DJANGO_SETTINGS_MODULE', 'config.settings.local'^)
    echo     execute_from_command_line^(sys.argv^)
) > "manage.py"
echo [OK] Fichier cree: manage.py

REM ========== LOCALE ==========
echo.
echo --- Creation dossiers locale ---

if not exist "locale\fr\LC_MESSAGES" mkdir "locale\fr\LC_MESSAGES"
if not exist "locale\ht\LC_MESSAGES" mkdir "locale\ht\LC_MESSAGES"
if not exist "locale\en\LC_MESSAGES" mkdir "locale\en\LC_MESSAGES"

type nul > "locale\fr\LC_MESSAGES\django.po"
type nul > "locale\ht\LC_MESSAGES\django.po"
type nul > "locale\en\LC_MESSAGES\django.po"

echo [OK] Repertoires locale crees

REM ========== RESULTAT FINAL ==========
echo.
echo ============================================
echo. Structure BACKEND creee avec succes!
echo ============================================
echo.
echo Localisation: %cd%
echo.
echo Prochaines etapes:
echo   1. python -m venv venv
echo   2. venv\Scripts\activate
echo   3. pip install -r requirements/local.txt
echo   4. python manage.py migrate
echo   5. python manage.py runserver
echo.
pause
