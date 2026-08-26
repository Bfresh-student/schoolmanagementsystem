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