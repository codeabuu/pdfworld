# supabase_client.py
# Make sure it's configured correctly for Supabase v2.18

from supabase import create_client, Client
from django.conf import settings


def get_supabase() -> Client | None:
    """
    Initialize and return a Supabase client.
    Uses the service role key for server-side operations.
    """
    try:
        if not getattr(settings, "SUPABASE_URL", None) or not getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None):
            raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Django settings.")

        supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
            # Optional: configure timeouts if needed (new in v2.18)
            # options={
            #     "postgrest_client_timeout": 30,
            #     "storage_client_timeout": 60,
            # }
        )
        return supabase

    except Exception as e:
        # Better to use Django's logging instead of print
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Supabase client initialization failed: {e}")
        return None
