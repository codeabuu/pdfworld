# views.py
from django.http import JsonResponse
from .auth_utils import verify_supabase_jwt
import jwt
import logging

logger = logging.getLogger(__name__)

def me(request):
    logger.info("=== /api/me/ endpoint called ===")
    
    # Try to get token from Authorization header first
    auth_header = request.headers.get("Authorization", "")
    logger.info(f"Authorization header: {auth_header}")
    
    if auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ", 1)[1].strip()
            logger.info(f"JWT token received (first 50 chars): {token[:50]}...")
            
            decoded = verify_supabase_jwt(token)
            logger.info(f"Token decoded successfully: {decoded}")
            
            return JsonResponse({"user": decoded})
            
        except jwt.InvalidTokenError as e:
            logger.error(f"JWT validation failed: {str(e)}")
            # Don't pass silently - let's see what the error is
            return JsonResponse({"error": f"JWT validation failed: {str(e)}"}, status=401)
        except Exception as e:
            logger.error(f"Unexpected error during JWT verification: {str(e)}")
            # Continue to check session authentication
    
    # If no token or invalid token, check session authentication
    logger.info("Checking session authentication...")
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