# google_oauth_views.py - Fixed version

import secrets
import logging
from urllib.parse import urlencode

from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from django.contrib.auth import login

from .supabase_client import get_supabase
from .models import UserProfile

logger = logging.getLogger(__name__)

# -----------------------------
# INIT: generate OAuth URL
# -----------------------------
@csrf_exempt
@require_http_methods(["GET"])
def google_oauth_init(request):
    """
    Initialize Google OAuth flow
    Supabase handles the OAuth callback, then redirects to our application
    """
    try:
        # Force session creation if it doesn't exist
        if not request.session.session_key:
            request.session.create()
        
        # Get redirect destination from query params
        redirect_to = request.GET.get('redirect_to', 'http://127.0.0.1:8080/dashboard')
        action = request.GET.get('action', 'signup')

        supabase = get_supabase()
        if not supabase:
            return JsonResponse({"error": "Supabase client not initialized"}, status=500)

        # Generate state token for security
        state_token = secrets.token_urlsafe(32)
        request.session['oauth_state'] = state_token
        request.session['oauth_redirect_to'] = redirect_to
        request.session['oauth_action'] = action
        
        # Force session modification flag and save
        request.session.modified = True
        request.session.save()

        logger.info(f"Session created with ID: {request.session.session_key}")
        logger.info(f"Stored state token: {state_token}")
        logger.info(f"Redirect destination: {redirect_to}")

        # IMPORTANT: Use your Django backend callback URL
        # Supabase will redirect HERE after processing Google's OAuth response
        django_callback_url = f"http://127.0.0.1:8000/api/auth/google/callback/"

        # Generate Google OAuth URL with Supabase
        auth_response = supabase.auth.sign_in_with_oauth({
            "provider": "google",
            "options": {
                # This is where Supabase will redirect after OAuth
                "redirect_to": django_callback_url,
                "scopes": "email profile",
                # Pass state in query params
                "query_params": {
                    "state": state_token
                }
            }
        })

        logger.info(f"Generated OAuth URL: {auth_response.url}")

        # Return session ID to client
        response = JsonResponse({
            "status": "success",
            "url": auth_response.url,
            "state_token": state_token,
            "session_id": request.session.session_key
        }, status=200)
        
        # Explicitly set session cookie
        response.set_cookie(
            'sessionid',
            request.session.session_key,
            max_age=1209600,  # 2 weeks
            httponly=True,
            samesite='Lax',
            domain=None  # Use default domain
        )
        
        return response

    except Exception as e:
        logger.error(f"Google OAuth init error: {str(e)}", exc_info=True)
        return JsonResponse({"error": str(e)}, status=500)


# -----------------------------
# CALLBACK: handle Supabase redirect
# -----------------------------
@csrf_exempt
@require_http_methods(["GET"])
def google_oauth_callback(request):
    """
    Handle Supabase's redirect after Google OAuth
    """
    try:
        logger.info("=== GOOGLE OAUTH CALLBACK STARTED ===")
        logger.info(f"Request session key: {request.session.session_key}")
        logger.info(f"Request cookies: {list(request.COOKIES.keys())}")
        
        # Get tokens from URL
        access_token = request.GET.get('access_token')
        refresh_token = request.GET.get('refresh_token')
        error = request.GET.get('error')
        
        redirect_to = request.session.get('oauth_redirect_to', 'http://127.0.0.1:8080/dashboard')
        
        logger.info(f"Access token present: {bool(access_token)}")
        logger.info(f"Refresh token present: {bool(refresh_token)}")

        # Check for errors
        if error:
            logger.error(f"OAuth error: {error}")
            return HttpResponseRedirect(f"{redirect_to}?error=auth_failed")

        if not access_token:
            logger.warning("No access token in query params")
            return HttpResponseRedirect(f"{redirect_to}?oauth_callback=true")

        supabase = get_supabase()
        if not supabase:
            logger.error("Supabase client not initialized")
            return HttpResponseRedirect(f"{redirect_to}?error=server_error")

        # Get user info from Supabase
        try:
            supabase.auth.set_session(access_token, refresh_token)
            user_response = supabase.auth.get_user(access_token)
            user = user_response.user
            
            if not user:
                logger.error("No user data returned from Supabase")
                return HttpResponseRedirect(f"{redirect_to}?error=no_user_data")

            logger.info(f"OAuth successful for user: {user.email}")

            # Sync user with Django database
            django_user = sync_google_user_with_django(user)
            if not django_user:
                logger.error("Failed to sync user with Django")
                return HttpResponseRedirect(f"{redirect_to}?error=user_sync_failed")

            # CRITICAL FIX: Log in Django user and save session properly
            login(request, django_user)
            
            # Force session to save and get a new session key if needed
            request.session.cycle_key()  # This creates a new session to prevent fixation
            request.session.modified = True
            request.session.save()
            
            logger.info(f"Session after login - Key: {request.session.session_key}")
            logger.info(f"User authenticated: {request.user.is_authenticated}")
            logger.info(f"User ID in session: {request.session.get('_auth_user_id')}")

            # Build success redirect URL
            success_params = {
                "success": "google_oauth_success",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user_id": user.id,
                "email": user.email,
                "provider": "google"
            }
            
            if '?' in redirect_to:
                redirect_url = f"{redirect_to}&{urlencode(success_params)}"
            else:
                redirect_url = f"{redirect_to}?{urlencode(success_params)}"

            response = HttpResponseRedirect(redirect_url)
            
            # CRITICAL: Set session cookie with proper settings
            response.set_cookie(
                'sessionid',
                request.session.session_key,
                max_age=1209600,  # 2 weeks
                httponly=True,
                samesite='Lax',
                secure=False,  # Set to True in production with HTTPS
                path='/',
            )
            
            logger.info("=== GOOGLE OAUTH CALLBACK COMPLETED ===")
            return response

        except Exception as e:
            logger.error(f"Error getting user from Supabase: {str(e)}", exc_info=True)
            return HttpResponseRedirect(f"{redirect_to}?error=token_exchange_failed")

    except Exception as e:
        logger.error(f"Google OAuth callback error: {str(e)}", exc_info=True)
        redirect_to = request.session.get('oauth_redirect_to', 'http://127.0.0.1:8080/dashboard')
        return HttpResponseRedirect(f"{redirect_to}?error=auth_failed")


# -----------------------------
# Helper: Sync Supabase user with Django
# -----------------------------
def sync_google_user_with_django(supabase_user):
    """
    Sync a Supabase user with Django's User model
    """
    try:
        email = supabase_user.email
        user_id = supabase_user.id
        if not email:
            logger.error("No email found in Supabase user data")
            return None

        metadata = supabase_user.user_metadata or {}
        full_name = metadata.get("full_name", metadata.get("name", ""))
        avatar_url = metadata.get("avatar_url", metadata.get("picture", ""))
        
        # Split name into first and last
        name_parts = full_name.split(" ", 1) if full_name else ["", ""]
        first_name = name_parts[0] if len(name_parts) > 0 else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # Create or get Django user
        django_user, created = User.objects.get_or_create(
            username=user_id,  # Use Supabase ID as username
            defaults={
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "is_active": True
            }
        )

        # Update user info if it changed
        if not created:
            django_user.email = email
            django_user.first_name = first_name
            django_user.last_name = last_name
            django_user.save()

        # Create or update user profile
        profile, _ = UserProfile.objects.get_or_create(
            user=django_user,
            defaults={
                "supabase_id": user_id,
                "auth_provider": "google",
                "email_verified": supabase_user.email_confirmed_at is not None,
                "avatar_url": avatar_url
            }
        )

        # Update profile if it exists
        if not created:
            profile.supabase_id = user_id
            profile.auth_provider = "google"
            profile.email_verified = supabase_user.email_confirmed_at is not None
            profile.avatar_url = avatar_url
            profile.save()

        logger.info(f"Successfully synced user: {email} ({'created' if created else 'updated'})")
        return django_user
        
    except Exception as e:
        logger.error(f"Error syncing Google user with Django: {str(e)}", exc_info=True)
        return None