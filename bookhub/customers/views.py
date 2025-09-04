# views.py
from django.http import JsonResponse
from .auth_utils import verify_supabase_jwt
import jwt
import logging

logger = logging.getLogger(__name__)
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='60/m', block=False)
def me(request):
    logger.info("=== /api/me/ endpoint called ===")
    
    # Try to get token from Authorization header first
    auth_header = request.headers.get("Authorization", "")
    token = None
    
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        logger.info(f"JWT token from Authorization header (first 50 chars): {token[:50]}...")
    else:
        # Try to get token from httpOnly cookie
        token = request.COOKIES.get("sb-access")  # or whatever your COOKIE_NAME is
        if token:
            logger.info(f"JWT token from cookie (first 50 chars): {token[:50]}...")
    
    if token:
        try:
            decoded = verify_supabase_jwt(token)
            logger.info(f"Token decoded successfully: {decoded}")
            
            return JsonResponse({"user": decoded})
            
        except jwt.InvalidTokenError as e:
            logger.error(f"JWT validation failed: {str(e)}")
            return JsonResponse({"error": f"JWT validation failed: {str(e)}"}, status=401)
        except Exception as e:
            logger.error(f"Unexpected error during JWT verification: {str(e)}")
    
    # If no token found, check session authentication as fallback
    logger.info("No JWT token found, checking session authentication...")
    if hasattr(request, 'user') and request.user.is_authenticated:
        logger.info(f"Session user authenticated: {request.user.email}")
        return JsonResponse({
            "user": {
                "id": request.user.id,
                "email": request.user.email,
                "username": request.user.username,
                "is_authenticated": True
            }
        })
    else:
        logger.warning("No authenticated user found in session")
    
    # If neither method works, return unauthorized
    logger.error("No valid authentication method found")
    return JsonResponse({"error": "Unauthorized"}, status=401)