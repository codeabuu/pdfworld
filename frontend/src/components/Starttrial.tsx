// components/StartTrial.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, User, ChevronDown, CreditCard, Settings, HelpCircle, LogOut } from 'lucide-react';
import { subscriptionService } from '@/services/subservice';
import { authService } from '@/services/Myauthservice';
import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000";

interface UserData {
  id: string;
  email: string;
  created_at?: string;
}

interface Subscription {
  has_access: boolean;
  status: string;
  trial_end?: string;
  in_trial?: boolean;
  trial_has_ended?: boolean;
  message?: string;
}

const StartTrial = () => {
  const navigate = useNavigate();
  const [isEligible, setIsEligible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkEligibility();
    fetchUserData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserData = async () => {
    try {
      const isAuth = await authService.checkAuth();
      if (!isAuth) {
        navigate('/login');
        return;
      }

      const userId = authService.getUserId();
      if (!userId) return;

      // Fetch user email from /api/me/
      try {
        const response = await axios.get(`${API_BASE_URL}/api/me/`);
        const userData = response.data.user || response.data;
        const userEmail = userData.email || "Unknown";
        
        setUser({
          id: userId,
          email: userEmail,
          created_at: userData.created_at
        });

        // Fetch subscription status
        const subscriptionData = await subscriptionService.checkSubscriptionStatus(userId);
        setSubscription(subscriptionData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUser({
          id: userId,
          email: "Unknown",
          created_at: undefined
        });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const checkEligibility = async () => {
    try {
      const userId = authService.getUserId();
      if (!userId) {
        navigate('/login');
        return;
      }

      const eligibility = await subscriptionService.checkTrialEligibility(userId);
      setIsEligible(eligibility.eligible);
      
      if (!eligibility.eligible) {
        setError(eligibility.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check eligibility');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      setIsStarting(true);
      const userId = authService.getUserId();
      const userEmail = user?.email || 'user@example.com';
      
      if (!userId || !userEmail) {
        navigate('/login');
        return;
      }

      const result = await subscriptionService.startTrial(userId, userEmail);
      window.location.href = result.authorization_url;
    } catch (err: any) {
      setError(err.message || 'Failed to start trial');
    } finally {
      setIsStarting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
      setIsProfileDropdownOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getPlanBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 text-xs">Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-600 text-xs">Free Trial</Badge>;
      case "past_due":
        return <Badge className="bg-amber-600 text-xs">Past Due</Badge>;
      case "canceled":
        return <Badge variant="outline" className="text-xs">Canceled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Inactive</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      {/* Profile Dropdown */}
      <div className="hidden sm:block absolute top-4 right-4 z-50" ref={profileDropdownRef}>
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-amber-600" />
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>

          {isProfileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {/* User Info Section */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.email || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subscription ? (
                        <span className="flex items-center gap-1">
                          {getPlanBadge(subscription.status)}
                          {subscription.status === "trialing" && "Trial"}
                        </span>
                      ) : (
                        "Free Plan"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription Section */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Subscription</span>
                  {subscription && getPlanBadge(subscription.status)}
                </div>
                
                {subscription?.status === "trialing" && subscription.trial_end && (
                  <p className="text-xs text-muted-foreground">
                    Trial ends: {new Date(subscription.trial_end).toLocaleDateString()}
                  </p>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => {
                    navigate("/subscription");
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <CreditCard className="h-3 w-3 mr-2" />
                  Manage Subscription
                </Button>
              </div>

              {/* Settings Links */}
              <div className="px-4 py-2 border-b border-gray-100">
                <button
                  className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md"
                  onClick={() => {
                    navigate("/testprofile");
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Profile & Settings
                </button>
                
                <button className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </button>
                
                <button className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  Help & FAQ
                </button>
              </div>

              {/* Logout Section */}
              <div className="px-4 py-2">
                <button
                  className="w-full flex items-center gap-3 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Start Your Free Trial</CardTitle>
          <CardDescription>
            {isEligible 
              ? "Get 7 days of unlimited access to all premium features"
              : "Subscription status check"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="bg-destructive/15 text-destructive p-3 rounded-lg flex items-center space-x-2">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : isEligible ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>You're eligible for a free trial!</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ 7 days of unlimited access</li>
                  <li>✓ All premium features included</li>
                  <li>✓ No credit card required upfront</li>
                  <li>✓ Cancel anytime</li>
                </ul>
              </div>
              
              <Button 
                onClick={handleStartTrial} 
                disabled={isStarting}
                className="w-full"
                size="lg"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing your trial...
                  </>
                ) : (
                  'Start 7-Day Free Trial'
                )}
              </Button>
            </>
          ) : (
            <div className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">
                You're not eligible for a free trial at this time.
              </p>
            </div>
          )}
          
          <div className="text-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              size="sm"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StartTrial;