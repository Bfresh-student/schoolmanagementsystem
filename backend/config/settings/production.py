import os

from .base import *

# Permet d'activer DEBUG=True temporairement via une variable d'environnement
# Railway, uniquement pour le diagnostic — NE JAMAIS laisser activé en usage
# normal (la page de debug Django expose des infos sensibles).
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Railway (et la plupart des PaaS) terminent le TLS au niveau du proxy et
# forwardent en HTTP en interne. Sans ce header, Django croit que toutes les
# requêtes arrivent en HTTP et les redirige — ce qui casse le preflight CORS.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ── Supabase S3-compatible storage ──────────────────────────────
STORAGES = {
    "default": {
        "BACKEND": "config.storage_backends.SupabasePublicStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

AWS_ACCESS_KEY_ID = os.environ.get("SUPABASE_S3_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("SUPABASE_S3_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.environ.get("SUPABASE_BUCKET_NAME")
AWS_S3_ENDPOINT_URL = os.environ.get("SUPABASE_S3_ENDPOINT")
AWS_S3_REGION_NAME = os.environ.get("SUPABASE_S3_REGION")

AWS_DEFAULT_ACL = None            # let bucket-level policy control access
AWS_S3_ADDRESSING_STYLE = "path"  # required for Supabase's S3 implementation
AWS_S3_FILE_OVERWRITE = False     # avoid overwriting files with the same name
AWS_S3_SIGNATURE_VERSION = "s3v4" # explicit signature version, safest default

# Optional: if your bucket is public, this makes .url on ImageField
# return a clean public link instead of a signed URL
AWS_QUERYSTRING_AUTH = False