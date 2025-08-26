// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authService } from '@/services/Myauthservice';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authenticated = await authService.checkAuth();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  return {
    isAuthenticated,
    isLoading: isAuthenticated === null
  };
};