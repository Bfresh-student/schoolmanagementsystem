import os
from storages.backends.s3 import S3Storage


class SupabasePublicStorage(S3Storage):
    """
    Les uploads passent par l'API S3-compatible (fonctionne avec django-storages),
    mais les URLs publiques utilisent l'endpoint natif Supabase, car la
    passerelle S3 de Supabase exige des requêtes signées même en lecture.
    """

    def url(self, name, parameters=None, expire=None, http_method=None):
        supabase_project_url = os.environ["SUPABASE_PROJECT_URL"].rstrip("/")
        bucket = self.bucket_name
        return f"{supabase_project_url}/storage/v1/object/public/{bucket}/{name}"