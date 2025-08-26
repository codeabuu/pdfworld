# auth_utils.py
import jwt
from functools import wraps
from django.http import JsonResponse
from django.conf import settings
from jwt import InvalidTokenError
import logging

logger = logging.getLogger(__name__)

def verify_supabase_jwt(token: str):
    try:
        logger.info(f"Verifying Supabase JWT token...")
        
        # Supabase JWT specific configuration
        decoded = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"],
            options={
                "verify_aud": False,  # Supabase tokens might not have standard aud claim
                "verify_iss": False,  # Optional: disable iss verification if needed
            }
        )
        
        logger.info(f"Token decoded successfully for user: {decoded.get('email', 'No email')}")
        return decoded
        
    except jwt.ExpiredSignatureError:
        logger.error("JWT token has expired")
        raise InvalidTokenError("Token has expired")
    except jwt.InvalidAudienceError:
        logger.error("JWT audience claim is invalid")
        raise InvalidTokenError("Invalid audience")
    except jwt.InvalidIssuerError:
        logger.error("JWT issuer claim is invalid")
        raise InvalidTokenError("Invalid issuer")
    except jwt.InvalidAlgorithmError:
        logger.error("JWT algorithm is invalid")
        raise InvalidTokenError("Invalid algorithm")
    except Exception as e:
        logger.error(f"JWT verification failed: {str(e)}")
        raise InvalidTokenError(f"Token verification failed: {str(e)}")

def supabase_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return JsonResponse({"error": "Unauthorized - No token provided"}, status=401)
        
        token = auth.split(" ", 1)[1].strip()
        try:
            decoded = verify_supabase_jwt(token)
            request.supabase_user = decoded
            return view_func(request, *args, **kwargs)
        except InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            return JsonResponse({"error": f"Invalid token: {str(e)}"}, status=401)
    return wrapper