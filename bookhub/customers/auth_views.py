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
@ratelimit(key='ip', rate='3/h', block=False) 
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
        res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "firstName": first_name,
            "lastName": last_name
        })

        # Convert result
        out = res.model_dump() if hasattr(res, "model_dump") else res
        response = JsonResponse(out, status=201)

        session = out.get("session") or {}
        _set_session_cookies(response, session, remember_me)
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
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