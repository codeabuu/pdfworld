// components/ProfileSettingsModal.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  User, 
  X, 
  Eye, 
  EyeOff,
  Calendar,
  Loader2,
  Crown,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { authService } from "@/services/Myauthservice";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordData, changePassword } from "@/lib/api";

const API_BASE_URL = "http://127.0.0.1:8000";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  subscription: any;
}

interface UserData {
  id: string;
  email: string;
  name?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  created_at?: string;
}

const ProfileSettingsModal = ({ 
  isOpen, 
  onClose, 
  user: propUser, 
  subscription 
}: ProfileSettingsModalProps) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  // Fetch user data when modal opens
  useEffect(() => {
    const fetchUserData = async () => {
      if (isOpen) {
        setIsFetching(true);
        try {
          const token = authService.getAuthToken();
          if (!token) {
            throw new Error("Not authenticated");
          }

          const response = await axios.get(`${API_BASE_URL}/api/me/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          const userData = response.data.user || response.data;
          console.log("User data from API:", userData);
          
          // Extract name from various possible fields
          const userName = userData.name || 
                          userData.display_name || 
                          userData.username || 
                          (userData.first_name && userData.last_name 
                            ? `${userData.first_name} ${userData.last_name}` 
                            : userData.first_name || userData.last_name || "");
          
          setUser({
            id: userData.id || userData.sub || authService.getUserId() || "",
            email: userData.email || "Unknown",
            name: userName,
            created_at: userData.created_at
          });
        } catch (error: any) {
          console.error("Failed to fetch user data:", error);
          // Fallback to the user data passed as prop
          if (propUser) {
            setUser(propUser);
          } else {
            toast({
              title: "Error",
              description: "Failed to load user data",
              variant: "destructive",
            });
          }
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchUserData();
  }, [isOpen, propUser, toast]);

const handleSaveChanges = async () => {
  setIsLoading(true);
  try {
    // If password change is in progress, handle that
    if (isEditingPassword) {
      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        toast({
          title: "Error",
          description: "New password must be at least 6 characters.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Use the new API function
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsEditingPassword(false);
    }
    
    onClose();
  } catch (error: any) {
    console.error("Error updating password:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to update password. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
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

  // Calculate days remaining for trial
  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return null;
    const endDate = new Date(dateString);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get subscription badge based on status
  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-600">Free Trial</Badge>;
      case "past_due":
        return <Badge className="bg-amber-600">Past Due</Badge>;
      case "canceled":
        return <Badge variant="outline">Canceled</Badge>;
      case "incomplete":
        return <Badge className="bg-gray-600">Incomplete</Badge>;
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  // Get subscription plan name
  const getSubscriptionPlanName = () => {
    if (!subscription) return "No active subscription";
    
    // Check for different plan types
    if (subscription.plan_type === "monthly" || subscription.interval === "month") {
      return "Monthly Plan";
    } else if (subscription.plan_type === "yearly" || subscription.interval === "year") {
      return "Yearly Plan";
    } else if (subscription.plan_type === "lifetime") {
      return "Lifetime Plan";
    } else if (subscription.status === "trialing") {
      return "Free Trial";
    }
    
    return subscription.plan_name || "Premium Plan";
  };

  // Get subscription price
  const getSubscriptionPrice = () => {
    if (!subscription) return null;
    
    if (subscription.amount) {
      return `$${(subscription.amount / 100).toFixed(2)}`;
    } else if (subscription.price) {
      return `$${(subscription.price / 100).toFixed(2)}`;
    }
    
    return null;
  };

  // Get subscription billing cycle
  const getSubscriptionBillingCycle = () => {
    if (!subscription) return null;
    
    if (subscription.interval === "month" || subscription.plan_type === "monthly") {
      return "per month";
    } else if (subscription.interval === "year" || subscription.plan_type === "yearly") {
      return "per year";
    } else if (subscription.plan_type === "lifetime") {
      return "one-time payment";
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-lg">
        <div className="relative">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5" />
              Profile & Settings
            </DialogTitle>
            <DialogDescription>
              Manage your account information and settings
            </DialogDescription>
          </DialogHeader>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {isFetching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {/* Email Field */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Email
                  </Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {user?.email || "No email set"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed as it's tied to your login
                  </p>
                </div>

                {/* Subscription Information */}
                {subscription && (
                  <div className="mb-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3 mb-3">
                      <Crown className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Subscription</h3>
                      {getSubscriptionBadge(subscription.status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Plan</span>
                        <span className="text-sm font-semibold text-blue-700">
                          {getSubscriptionPlanName()}
                        </span>
                      </div>
                      
                      {getSubscriptionPrice() && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Price</span>
                          <span className="text-sm text-foreground">
                            {getSubscriptionPrice()} {getSubscriptionBillingCycle()}
                          </span>
                        </div>
                      )}
                      
                      {subscription.current_period_end && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {subscription.status === "trialing" ? "Trial ends" : "Renews on"}
                            </span>
                            <span className="text-sm text-foreground">
                              {formatDate(subscription.current_period_end)}
                            </span>
                          </div>
                          
                          {/* Add days remaining for trial users */}
                          {subscription.status === "trialing" && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Days remaining</span>
                              <span className="text-sm font-semibold text-blue-600">
                                {getDaysRemaining(subscription.current_period_end)} days
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      
                      {subscription.status === "active" && (
                        <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Your subscription is active</span>
                        </div>
                      )}
                      
                      {subscription.status === "past_due" && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Payment required - please update your payment method</span>
                        </div>
                      )}
                      
                      {/* Add a special message for trial users */}
                      {subscription.status === "trialing" && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                          <Clock className="h-4 w-4" />
                          <span>Your free trial includes full access to all features</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Password Change Section */}
                {!isEditingPassword ? (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingPassword(true)}
                      className="w-full"
                    >
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <div className="mb-4 p-3 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">Change Password</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingPassword(false)}
                        className="h-6 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="relative">
                        <Label htmlFor="currentPassword" className="text-xs">
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-6 h-8 w-8"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="relative">
                        <Label htmlFor="newPassword" className="text-xs">
                          New Password
                        </Label>
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-6 h-8 w-8"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="relative">
                        <Label htmlFor="confirmPassword" className="text-xs">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-6 h-8 w-8"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/20 flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges} 
              disabled={isLoading || !isEditingPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettingsModal;