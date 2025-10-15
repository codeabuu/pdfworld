# customers/test_gauth.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .supabase_client import get_supabase


class TestSupabaseConnectionView(APIView):
    def get(self, request):
        try:
            supabase = get_supabase()
            if not supabase:
                return Response({
                    'status': 'error',
                    'message': 'Supabase client not initialized'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Simple ping test — list all public tables
            from postgrest import APIError

            try:
                result = supabase.postgrest.schema("public").rpc("version").execute()
            except APIError:
                # fallback if no RPC "version" function
                result = {"message": "Client initialized successfully"}

            return Response({
                'status': 'success',
                'message': 'Supabase client connected successfully',
                'data': result
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Supabase connection failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class GoogleOAuthInitView(APIView):
    def get(self, request):
        """Initialize Google OAuth - returns OAuth URL"""
        try:
            supabase = get_supabase()
            if not supabase:
                return Response({'error': 'Supabase client not initialized'},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            redirect_to = request.GET.get('redirect_to', 'http://localhost:3000/dashboard')
            print(f"Initializing Google OAuth with redirect: {redirect_to}")

            # ✅ Use the new v2 method
            auth_response = supabase.auth.sign_in_with_oauth(
                {
                    "provider": "google",
                    "options": {
                        "redirect_to": f"http://127.0.0.1:8080/api/auth/google/callback?redirect_to={redirect_to}",
                    }
                }
            )

            print(f"OAuth URL generated: {auth_response.url}")

            return Response({
                'status': 'success',
                'url': auth_response.url,
                'message': 'Google OAuth URL generated successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Google OAuth init error: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleOAuthCallbackView(APIView):
    def get(self, request):
        """Handle Google OAuth callback"""
        try:
            supabase = get_supabase()
            code = request.GET.get('code')
            error = request.GET.get('error')
            redirect_to = request.GET.get('redirect_to', 'http://localhost:3000/dashboard')

            print(f"OAuth callback received - code: {bool(code)}, error: {error}")

            if error:
                return Response({'status': 'error', 'error': f'OAuth error: {error}'},
                                status=status.HTTP_400_BAD_REQUEST)

            if not code:
                return Response({'status': 'error', 'error': 'No authorization code received'},
                                status=status.HTTP_400_BAD_REQUEST)

            print("Exchanging code for session...")
            session = supabase.auth.exchange_code_for_session({"auth_code": code})

            if session and getattr(session, "user", None):
                user = session.user
                print(f"User authenticated: {user.email}")

                return Response({
                    'status': 'success',
                    'message': 'Google OAuth successful',
                    'data': {
                        'user_id': user.id,
                        'email': user.email,
                        'email_verified': user.email_confirmed_at is not None,
                        'access_token': session.access_token,
                        'refresh_token': session.refresh_token,
                        'user_metadata': user.user_metadata
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'status': 'error',
                    'error': 'Failed to authenticate user'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"Google OAuth callback error: {str(e)}")
            return Response({
                'status': 'error',
                'error': f'OAuth callback failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
