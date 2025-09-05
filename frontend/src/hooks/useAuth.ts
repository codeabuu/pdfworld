// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authService } from '@/services/Myauthservice';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { authenticated, user: userData } = await authService.checkAuthStatus();
        setIsAuthenticated(authenticated);
        setUser(userData || null);
        
        // If authenticated, also update the user ID in localStorage
        if (authenticated && userData?.id) {
          localStorage.setItem('user_id', userData.id);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  return {
    isAuthenticated,
    user,
    isLoading: loading
  };
};