// components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/services/Myauthservice';
import { subscriptionService } from '@/services/subservice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireSubscription = true 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        // First check authentication
        const authenticated = await authService.checkAuth();
        setIsAuthenticated(authenticated);

        if (!authenticated) {
          setIsLoading(false);
          return;
        }

        // If subscription is required, check subscription status
        if (requireSubscription) {
          const userId = authService.getUserId();
          if (userId) {
            try {
              const subscriptionStatus = await subscriptionService.checkSubscriptionStatus(userId);
              setHasSubscription(subscriptionStatus.has_access);
            } catch (error) {
              console.error('Subscription check failed:', error);
              setHasSubscription(false);
            }
          } else {
            setHasSubscription(false);
          }
        } else {
          // Subscription not required, just set to true
          setHasSubscription(true);
        }

      } catch (error) {
        console.error('Authentication error:', error);
        setIsAuthenticated(false);
        setHasSubscription(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAccess();
  }, [requireSubscription]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but subscription required and not available - redirect to trial page
  if (requireSubscription && !hasSubscription) {
    return <Navigate to="/start-trial" replace />;
  }

  // All checks passed - render children
  return <>{children}</>;
};

export default ProtectedRoute;