# supabase_client.py - Make sure it's configured correctly
from supabase import create_client, Client
from django.conf import settings

def get_supabase():
    try:
        # Use the service role key for server-side operations
        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY  # Try using service role instead of anon key
        )
        return supabase
    except Exception as e:
        print(f"Supabase client error: {e}")
        return None