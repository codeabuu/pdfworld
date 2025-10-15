// AuthCallback.tsx - Simplified version
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/Myauthservice';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('OAuth callback received parameters:', Object.fromEntries(searchParams.entries()));
        
        // Wait for session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if we're authenticated
        const isAuthenticated = await authService.checkAuth();
        console.log('Authentication result:', isAuthenticated);
        
        if (isAuthenticated) {
          // Success - redirect to dashboard
          navigate('/dashboard');
        } else {
          // Failed - redirect to login with error
          navigate('/login', { 
            state: { error: 'Google sign-in failed. Please try again.' } 
          });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login', { 
          state: { error: 'Authentication failed. Please try again.' } 
        });
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;