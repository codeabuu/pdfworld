// src/components/PaymentSuccess.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { subscriptionService } from "@/services/subservice";
import { authService } from "@/services/Myauthservice";

const PaymentSuccess = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const userId = authService.getUserId();
        if (!userId) {
          toast({
            title: "Authentication Error",
            description: "Please log in again",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        // Check if user now has subscription access
        const status = await subscriptionService.checkSubscriptionStatus(userId);
        
        if (status.has_access) {
          setHasAccess(true);
          toast({
            title: "Success!",
            description: "Your subscription has been activated",
          });
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        } else {
          // If no access yet, retry a few times (Paystack might be processing)
          if (retryCount < 5) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000); // Retry every 2 seconds
          } else {
            // Max retries reached
            throw new Error("Subscription activation is taking longer than expected");
          }
        }
      } catch (error: any) {
        console.error("Subscription check error:", error);
        setIsChecking(false);
        toast({
          title: "Activation Pending",
          description: error?.message || "Your subscription is being activated. This may take a few minutes.",
          variant: "destructive",
        });
      }
    };

    checkSubscriptionStatus();
  }, [retryCount, navigate, toast]);

  // Show loading while checking
  if (isChecking && retryCount < 5) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Activating Your Subscription</h2>
                <p className="text-muted-foreground">
                  {retryCount > 0 
                    ? `Checking status... (${retryCount}/5)`
                    : "Please wait while we activate your subscription..."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {hasAccess ? (
              <>
                <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                <div>
                  <h2 className="text-2xl font-bold">Welcome Aboard!</h2>
                  <p className="text-muted-foreground">
                    Your subscription is now active. Redirecting to dashboard...
                  </p>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={() => navigate("/dashboard")}
                    className="w-full"
                  >
                    Go to Dashboard Now
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/pricing")}
                    className="w-full"
                  >
                    Back to Pricing
                  </Button>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 mx-auto text-amber-500" />
                <div>
                  <h2 className="text-2xl font-bold">Activation in Progress</h2>
                  <p className="text-muted-foreground">
                    Your subscription is being activated. This usually takes 1-2 minutes.
                    You'll receive an email confirmation when it's ready.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Check Status Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/pricing")}
                    className="w-full"
                  >
                    Back to Pricing
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/dashboard")}
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;