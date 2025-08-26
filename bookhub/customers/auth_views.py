import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from .supabase_client import get_supabase

COOKIE_NAME = "sb-access"
REFRESH_COOKIE_NAME = "sb-refresh"
COOKIE_OPTS = {
    "httponly": True,
    "samesite": "Lax",
    "secure": False,  # set True in production (HTTPS)
    "path": "/",
    "max_age": 60 * 60 * 24 * 7,  # 7 days
}

def _set_session_cookies(response, session):
    access_token = session.get("access_token")
    refresh_token = session.get("refresh_token")
    if access_token:
        response.set_cookie(COOKIE_NAME, access_token, **COOKIE_OPTS)
    if refresh_token:
        response.set_cookie(REFRESH_COOKIE_NAME, refresh_token, **COOKIE_OPTS)

@csrf_exempt
@require_POST
def signup(request):
    try:
        data = json.loads(request.body or "{}")
        email = data.get("email")
        password = data.get("password")
        first_name = data.get("firstName")
        last_name = data.get("lastName")

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
        _set_session_cookies(response, session)
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


# authviews.py - Update your login function
@csrf_exempt
@require_POST
def login(request):
    try:
        data = json.loads(request.body or "{}")
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return JsonResponse({"error": "Email and password required"}, status=400)

        supabase = get_supabase()
        
        # Try this authentication method instead:
        try:
            # Method 1: Using sign_in_with_password (recommended)
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            # Method 2: Alternative approach
            # auth_response = supabase.auth.sign_in_with_credentials({
            #     "email": email,
            #     "password": password
            # })
            
            user = auth_response.user
            session = auth_response.session
            
            response = JsonResponse({
                "user": {
                    "id": user.id,
                    "email": user.email,
                },
                "session": {
                    "access_token": session.access_token,
                    "refresh_token": session.refresh_token,
                    "expires_at": session.expires_at
                }
            })
            
            # Set cookies if needed
            if session.access_token:
                response.set_cookie(
                    'sb-access-token', 
                    session.access_token, 
                    httponly=True, 
                    samesite='Lax'
                )
                
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
