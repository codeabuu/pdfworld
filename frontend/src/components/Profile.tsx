// Profile.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  CreditCard, 
  Calendar, 
  LogOut, 
  Crown, 
  Clock,
  AlertCircle 
} from "lucide-react";
import { authService } from "@/services/Myauthservice";
import { subscriptionService } from "@/services/subservice";
import axios from "axios";

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

const Profile = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndSubscription = async () => {
      try {
        setLoading(true);
        setError(null);

        const isAuth = await authService.checkAuth();
        if (!isAuth) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Get user ID from authService instead of /api/me/
        const userId = authService.getUserId();
        
        if (!userId) {
          setError("User ID not found. Please log in again.");
          setLoading(false);
          return;
        }

        console.log("User ID from authService:", userId);

        // Fetch user email from /api/me/ endpoint
        try {
          const response = await axios.get(`${API_BASE_URL}/api/me/`);
          console.log("API /me/ response:", response.data);
          
          // Check different possible response structures for email
          const userData = response.data.user || response.data;
          const userEmail = userData.email || "Unknown";
          const createdAt = userData.created_at;
          
          setUser({
            id: userId,
            email: userEmail,
            created_at: createdAt
          });

          // Fetch subscription status using subscriptionService with user ID
          try {
            console.log("Fetching subscription for user ID:", userId);
            const subscriptionData = await subscriptionService.checkSubscriptionStatus(userId);
            console.log("Subscription data received:", subscriptionData);
            setSubscription(subscriptionData);
          } catch (subError: any) {
            console.error("Subscription fetch error details:", subError);
            setError("Failed to load subscription details. Please try again later.");
          }
        } catch (apiError: any) {
          console.error("API /me/ error:", apiError);
          // If we can't get email from /api/me/, still set user with ID and unknown email
          setUser({
            id: userId,
            email: "Unknown",
            created_at: undefined
          });
        }
      } catch (err: any) {
        console.error("Profile fetch error details:", err);
        setError(err.message || "Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndSubscription();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getPlanBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-600">Free Trial</Badge>;
      case "past_due":
        return <Badge className="bg-amber-600">Past Due</Badge>;
      case "canceled":
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return null;
    const endDate = new Date(dateString);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Loading...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your profile</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Not Authenticated</h3>
              <p className="text-muted-foreground mb-4">Please log in to view your profile</p>
              <Button onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profile & Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and subscription</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium">Email</span>
                <span className="text-muted-foreground">{user.email}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium">Member since</span>
                <span className="text-muted-foreground">
                  {user.created_at 
                    ? new Date(user.created_at).toLocaleDateString() 
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Your current plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive py-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please check the browser console for more details or contact support.
                  </p>
                </div>
              ) : subscription ? (
                <>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium">Status</span>
                    {getPlanBadge(subscription.status)}
                  </div>

                  {subscription.status === "trialing" && subscription.trial_end && (
                    <>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium">Trial ends</span>
                        <span className="text-muted-foreground">
                          {formatDate(subscription.trial_end)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium">Days remaining</span>
                        <span className="text-muted-foreground">
                          {getDaysRemaining(subscription.trial_end)} days
                        </span>
                      </div>
                    </>
                  )}

                  {subscription.message && (
                    <div className="text-sm text-muted-foreground py-2">
                      {subscription.message}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">No subscription data available</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/subscription")}
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/subscription")}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;