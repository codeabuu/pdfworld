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
        
        # Check if user with this email already exists
        try:
            existing_user = supabase.auth.admin.list_users()
            # Filter users by email (you might need to adjust this based on your Supabase setup)
            for user in existing_user:
                if user.email == email:
                    return JsonResponse(
                        {"error": "User with this email already exists"}, 
                        status=409
                    )
        except Exception as e:
            # If we can't check existing users, proceed but the sign_up will fail
            pass
        
        # Alternative approach: Use Supabase's built-in email check
        # This might be more reliable as Supabase will naturally reject duplicate emails
        res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "firstName": first_name,
                    "lastName": last_name
                }
            }
        })

        # Check if signup failed due to existing user
        if hasattr(res, 'error') and res.error:
            if 'already registered' in res.error.message.lower() or 'exists' in res.error.message.lower():
                return JsonResponse(
                    {"error": "User with this email already exists"}, 
                    status=409
                )
            else:
                # Re-raise other errors
                raise Exception(res.error.message)

        # Convert result
        out = res.model_dump() if hasattr(res, "model_dump") else res
        
        # Check if user was created successfully
        if out.get('user') and not out.get('user').get('confirmed_at'):
            # User created but needs email confirmation
            response = JsonResponse({
                "message": "Signup successful. Please check your email to confirm your account.",
                "user": out.get('user')
            }, status=201)
        else:
            response = JsonResponse(out, status=201)

        session = out.get("session") or {}
        _set_session_cookies(response, session, remember_me)
        return response
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        
        # Handle specific duplicate email error
        error_msg = str(e).lower()
        if 'already registered' in error_msg or 'exists' in error_msg or 'duplicate' in error_msg:
            return JsonResponse(
                {"error": "User with this email already exists"}, 
                status=409
            )
        
        return JsonResponse({"error": str(e)}, status=500)


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