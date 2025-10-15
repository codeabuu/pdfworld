import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from .supabase_client import get_supabase
from django_ratelimit.decorators import ratelimit


COOKIE_NAME = "sb-access"
REFRESH_COOKIE_NAME = "sb-refresh"
COOKIE_OPTS = {
    "httponly": True,
    "samesite": "Lax",
    "secure": False,  # set True in production (HTTPS)
    "path": "/",
    "max_age": 60 * 60 * 24 * 7,  # 7 days
}

def _set_session_cookies(response, session, remember_me=True):
    access_token = session.get("access_token")
    refresh_token = session.get("refresh_token")

    cookie_opts = COOKIE_OPTS.copy()
    if not remember_me:
        # Session cookie (expires when browser closes)
        cookie_opts["max_age"] = None
        cookie_opts["expires"] = None
    else:
        # 48-hour persistent cookie
        cookie_opts["max_age"] = 60 * 60 * 24 * 7
    
    if access_token:
        response.set_cookie(COOKIE_NAME, access_token, **cookie_opts)
    if refresh_token:
        response.set_cookie(REFRESH_COOKIE_NAME, refresh_token, **cookie_opts)



# authviews.py - Update your login function
@csrf_exempt
@require_POST
@ratelimit(key='ip', rate='5/m', block=False) 
def login(request):
    if getattr(request, 'limited', False):
        return JsonResponse({"error": "Too many login attempts. Try again later."}, status=429)
    try:
        data = json.loads(request.body or "{}")
        email = data.get("email")
        password = data.get("password")
        remember_me = data.get("rememberMe", True)
        
        if not email or not password:
            return JsonResponse({"error": "Email and password required"}, status=400)

        supabase = get_supabase()
        
        try:
            # Using sign_in_with_password (recommended)
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            user = auth_response.user
            session = auth_response.session
            
            # Create response with user info (no need to send tokens to frontend)
            response = JsonResponse({
                "user": {
                    "id": user.id,
                    "email": user.email,
                },
                "message": "Login successful"
            })
            
            # Use the consistent _set_session_cookies helper function
            session_dict = {
                "access_token": session.access_token,
                "refresh_token": session.refresh_token
            }
            _set_session_cookies(response, session_dict, remember_me)
            
            return response
            
        except Exception as auth_error:
            print(f"Supabase auth error: {auth_error}")
            return JsonResponse({"error": "Invalid credentials"}, status=401)
            
    except Exception as e:
        print(f"Login error: {e}")
        return JsonResponse({"error": "Server error"}, status=500)

@csrf_exempt
@require_POST
def logout(request):
    # Option A: just clear cookies server-side
    response = JsonResponse({"ok": True})
    response.delete_cookie(COOKIE_NAME, path="/")
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/")
    # Optionally revoke on Supabase:
    try:
        supabase = get_supabase()
        # If you track refresh_token per session, revoke here:
        # supabase.auth.admin.sign_out(...)  # not always necessary
    except Exception:
        pass
    return response


@csrf_exempt
@require_POST
def refresh_token(request):
    data = json.loads(request.body or "{}")
    # Prefer reading refresh token from httpOnly cookie
    refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME) or data.get("refresh_token")
    if not refresh_token:
        return JsonResponse({"error": "No refresh token"}, status=400)

    supabase = get_supabase()
    res = supabase.auth.refresh_session({"refresh_token": refresh_token})
    out = res.model_dump() if hasattr(res, "model_dump") else res
    session = out.get("session") or {}
    response = JsonResponse({"session": {"expires_at": session.get("expires_at")}})
    _set_session_cookies(response, session)
    return response

@csrf_exempt
@require_POST
def check_auth_status(request):
    """
    Check if user is authenticated based on cookies
    """
    access_token = request.COOKIES.get(COOKIE_NAME)
    refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)
    
    if not access_token and not refresh_token:
        return JsonResponse({"authenticated": False}, status=200)
    
    supabase = get_supabase()
    
    try:
        # Try to get user from access token
        if access_token:
            user = supabase.auth.get_user(access_token)
            if user:
                return JsonResponse({
                    "authenticated": True,
                    "user": {
                        "id": user.user.id,
                        "email": user.user.email,
                    }
                }, status=200)
        
        # If access token is invalid/expired, try refresh token
        if refresh_token:
            auth_response = supabase.auth.refresh_session({"refresh_token": refresh_token})
            if auth_response.session:
                user = auth_response.user
                session = auth_response.session
                
                response = JsonResponse({
                    "authenticated": True,
                    "user": {
                        "id": user.id,
                        "email": user.email,
                    }
                }, status=200)
                
                # Update cookies with new session
                session_dict = {
                    "access_token": session.access_token,
                    "refresh_token": session.refresh_token
                }
                _set_session_cookies(response, session_dict)
                return response
                
    except Exception as e:
        print(f"Auth check error: {e}")
        # Clear invalid cookies
        response = JsonResponse({"authenticated": False}, status=200)
        response.delete_cookie(COOKIE_NAME, path="/")
        response.delete_cookie(REFRESH_COOKIE_NAME, path="/")
        return response
    
    return JsonResponse({"authenticated": False}, status=200)

from rest_framework.response import Response
@csrf_exempt
@require_POST
@ratelimit(key='ip', rate='5/m', block=False)
def change_password(request):
    """
    Change password for authenticated user
    """
    if getattr(request, 'limited', False):
        return JsonResponse({"error": "Too many attempts. Try again later."}, status=429)
    try:
        # Get access token from cookie
        access_token = request.COOKIES.get(COOKIE_NAME)
        if not access_token:
            return JsonResponse({"error": "Not authenticated"}, status=401)

        supabase = get_supabase()
        
        # Verify the user is authenticated
        try:
            user_response = supabase.auth.get_user(access_token)
            if not user_response.user:
                return JsonResponse({"error": "Invalid authentication, try logging in again"}, status=401)
        except Exception:
            return JsonResponse({"error": "Invalid authentication, try logging in again"}, status=401)

        # Parse request data
        data = json.loads(request.body or "{}")
        current_password = data.get("currentPassword")
        new_password = data.get("newPassword")
        confirm_password = data.get("confirmPassword")

        # Validate input
        if not all([current_password, new_password, confirm_password]):
            return JsonResponse({"error": "All password fields are required"}, status=400)
        
        if new_password != confirm_password:
            return JsonResponse({"error": "New passwords do not match"}, status=400)
        
        if len(new_password) < 6:
            return JsonResponse({"error": "New password must be at least 6 characters"}, status=400)

        # Re-authenticate user with current password to verify identity
        try:
            # Get user email for re-authentication
            user_email = user_response.user.email
            
            # Sign in with current credentials
            auth_response = supabase.auth.sign_in_with_password({
                "email": user_email,
                "password": current_password
            })
            
            # Update password using the authenticated session
            update_response = supabase.auth.update_user({
                "password": new_password
            })
            
            # Convert response to dict
            out = update_response.model_dump() if hasattr(update_response, "model_dump") else update_response
            
            return JsonResponse({
                "message": "Password updated successfully",
                "user": {
                    "id": out.get("user", {}).get("id"),
                    "email": out.get("user", {}).get("email")
                }
            }, status=200)
            
        except Exception as auth_error:
            error_msg = str(auth_error).lower()
            if "invalid login credentials" in error_msg:
                return JsonResponse({"error": "Current password is incorrect"}, status=401)
            else:
                return JsonResponse({"error": f"Password update failed: {str(auth_error)}"}, status=400)
                
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        print(f"Change password error: {e}")
        return JsonResponse({"error": "Server error"}, status=500)
    

# views.py
@csrf_exempt
@require_POST
@ratelimit(key='ip', rate='5/h', block=False)
def forgot_password(request):
    """
    Send password reset email using Supabase v2.18
    """
    if getattr(request, 'limited', False):
        return JsonResponse({"error": "Too many attempts. Try again later."}, status=429)
    try:
        data = json.loads(request.body or "{}")
        email = data.get("email")
        
        print(f"=== DEBUG: Forgot Password Request ===")
        print(f"Email: {email}")
        
        if not email:
            return JsonResponse({"error": "Email is required"}, status=400)
        
        supabase = get_supabase()
        if not supabase:
            return JsonResponse({"error": "Server configuration error"}, status=500)
        
        # Get frontend URL for redirect
        frontend_url = "http://127.0.0.1:8080"  # Update this with your actual frontend URL
        redirect_url = "http://127.0.0.1:8080/auth/reset"
        
        print(f"Using redirect URL: {redirect_url}")
        
        try:
            # CORRECT METHOD FOR v2.18: Use reset_password_for_email
            print("Calling supabase.auth.reset_password_for_email...")
            result = supabase.auth.reset_password_for_email(
                email,
                options={"redirect_to": redirect_url}
            )
            
            print(f"Reset password result: {result}")
            
            # Check if there was an error
            if hasattr(result, 'error') and result.error:
                error_msg = str(result.error)
                print(f"Supabase error: {error_msg}")
                # Still return success for security
                
        except Exception as auth_error:
            print(f"Auth error in forgot_password: {auth_error}")
            # Still return success for security
        
        # For security, don't reveal if email exists or not
        return JsonResponse({
            "message": "If the email exists, a password reset link has been sent",
            "redirect_url": redirect_url
        }, status=200)

    except Exception as e:
        print(f"Forgot password error: {e}")
        import traceback
        traceback.print_exc()
        # Still return success for security
        return JsonResponse({
            "message": "If the email exists, a password reset link has been sent"
        }, status=200)
    
from supabase_auth._sync.gotrue_client import SyncGoTrueClient

import json
import jwt
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .supabase_client import get_supabase

@csrf_exempt
@require_POST
@ratelimit(key='ip', rate='5/h', block=False)
def reset_password(request):
    """
    Reset password using Supabase Admin API (no session required)
    """
    if getattr(request, 'limited', False):
        return JsonResponse({"error": "Too many attempts. Try again later."}, status=429)
    try:
        data = json.loads(request.body or "{}")
        new_password = data.get("newPassword")
        confirm_password = data.get("confirmPassword")
        token = data.get("token")

        # --- Validation ---
        if not all([new_password, confirm_password, token]):
            return JsonResponse({"error": "All fields are required"}, status=400)
        if new_password != confirm_password:
            return JsonResponse({"error": "Passwords do not match"}, status=400)
        if len(new_password) < 6:
            return JsonResponse({"error": "Password must be at least 6 characters"}, status=400)

        supabase = get_supabase()

        # --- Decode JWT to get user_id (sub) ---
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub")

        if not user_id:
            return JsonResponse({"error": "Invalid token"}, status=400)

        # --- Update password using Admin API ---
        result = supabase.auth.admin.update_user_by_id(
            user_id,
            {"password": new_password}
        )

        if getattr(result, "user", None):
            user_info = {
                "id": result.user.id,
                "email": result.user.email,
            }
            return JsonResponse({
                "message": "Password reset successfully",
                "user": user_info
            }, status=200)

        return JsonResponse({"error": "Failed to reset password"}, status=400)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
    

@csrf_exempt
@require_POST
@ratelimit(key='ip', rate='5/h', block=False)
def resend_confirmation_email(request):
    """
    Resend email confirmation for unverified users
    """
    if getattr(request, 'limited', False):
        return JsonResponse({"error": "Too many attempts. Try again later."}, status=429)
    try:
        data = json.loads(request.body or "{}")
        email = data.get("email")
        
        if not email:
            return JsonResponse({"error": "Email is required"}, status=400)
        
        supabase = get_supabase()
        
        # Check if user exists and is not confirmed
        try:
            # Get user by email using admin API
            users = supabase.auth.admin.list_users()
            target_user = None
            
            for user in users:
                if user.email == email:
                    target_user = user
                    break
            
            if not target_user:
                # Return generic success for security
                return JsonResponse({
                    "message": "If your email is registered, a confirmation email has been sent"
                }, status=200)
            
            # Check if user is already confirmed
            if target_user.email_confirmed_at:
                return JsonResponse({
                    "error": "Email is already confirmed. Please log in."
                }, status=400)
            
            # Resend confirmation email
            result = supabase.auth.resend({
                "type": "signup",
                "email": email,
                "options": {
                    "redirect_to": "http://127.0.0.1:8080/confirm-redirect"  # Your frontend redirect URL
                }
            })
            
            return JsonResponse({
                "message": "Confirmation email sent successfully"
            }, status=200)
            
        except Exception as e:
            # Still return success for security
            return JsonResponse({
                "message": "If your email is registered, a confirmation email has been sent"
            }, status=200)
            
    except Exception as e:
        return JsonResponse({
            "message": "If your email is registered, a confirmation email has been sent"
        }, status=200)

@csrf_exempt
@require_POST
@ratelimit(key='ip', rate='5/h', block=False)
def check_email_confirmation(request):
    """
    Check if user's email has been confirmed
    """
    if getattr(request, 'limited', False):
        return JsonResponse({"error": "Too many attempts. Try again later."}, status=429)
    try:
        data = json.loads(request.body or "{}")
        email = data.get("email")
        
        if not email:
            return JsonResponse({"error": "Email is required"}, status=400)
        
        supabase = get_supabase()
        
        # Get user by email using admin API
        users = supabase.auth.admin.list_users()
        target_user = None
        
        for user in users:
            if user.email == email:
                target_user = user
                break
        
        if not target_user:
            return JsonResponse({"error": "User not found"}, status=404)
        
        return JsonResponse({
            "confirmed": target_user.email_confirmed_at is not None,
            "email_confirmed_at": target_user.email_confirmed_at
        }, status=200)
            
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_POST
@ratelimit(key='ip', rate='5/h', block=False)
def signup(request):
    if getattr(request, "limited", False):
        return JsonResponse(
            {"error": "Too many signups. Please try again later."},
            status=429
        )
    try:
        data = json.loads(request.body or "{}")
        email = data.get("email")
        password = data.get("password")
        first_name = data.get("firstName")
        last_name = data.get("lastName")
        remember_me = data.get("rememberMe", True)

        if not email or not password:
            return JsonResponse({"error": "Email and password required"}, status=400)

        supabase = get_supabase()

        # Optional: check if user already exists
        try:
            existing_users = supabase.auth.admin.list_users()
            for user in existing_users.users:
                if user.email == email:
                    return JsonResponse(
                        {"error": "User with this email already exists"},
                        status=409
                    )
        except Exception:
            # Fail silently, signup itself will catch duplicates
            pass

        # Build confirm redirect URL
        frontend_url = "http://127.0.0.1:8080"
        confirm_redirect_url = f"{frontend_url}/confirm-redirect"

        # Attempt signup
        res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "firstName": first_name,
                    "lastName": last_name
                },
                "email_redirect_to": confirm_redirect_url
            }
        })

        # Handle Supabase errors
        if hasattr(res, 'error') and res.error:
            error_msg = str(res.error).lower()
            if 'already registered' in error_msg or 'exists' in error_msg or 'duplicate' in error_msg:
                return JsonResponse(
                    {"error": "User with this email already exists"},
                    status=409
                )
            raise Exception(str(res.error))

        out = res.model_dump() if hasattr(res, "model_dump") else res

        # Response for new users
        if out.get('user'):
            confirmed = out['user'].get('email_confirmed_at') is not None
            response_data = {
                "message": "Signup successful! Please check your email to confirm your account.",
                "user": {
                    "id": out['user'].get('id'),
                    "email": out['user'].get('email'),
                    "confirmed": confirmed
                },
                "requires_confirmation": not confirmed
            }

            # Only set session cookies if email already confirmed
            if confirmed:
                session = out.get("session") or {}
                response = JsonResponse(response_data, status=201)
                _set_session_cookies(response, session, remember_me)
            else:
                response = JsonResponse(response_data, status=201)

            return response

        return JsonResponse({"error": "Signup failed"}, status=400)

    except Exception as e:
        import traceback
        traceback.print_exc()

        error_msg = str(e).lower()
        if 'already registered' in error_msg or 'exists' in error_msg or 'duplicate' in error_msg:
            return JsonResponse(
                {"error": "User with this email already exists"},
                status=409
            )
        return JsonResponse({"error": str(e)}, status=500)