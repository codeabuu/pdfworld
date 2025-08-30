// components/StartTrial.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { subscriptionService } from '@/services/subservice';
import { authService } from '@/services/Myauthservice';

const StartTrial = () => {
  const navigate = useNavigate();
  const [isEligible, setIsEligible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    checkEligibility();
  }, []);

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
      // You'll need to get user email from your auth system or user context
      const userEmail = 'user@example.com'; // Replace with actual user email
      
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
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