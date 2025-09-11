// components/ManageSubscriptionModal.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  CreditCard, 
  MapPin, 
  Calendar,
  ChevronRight,
  Crown,
  X,
  Edit3,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: any;
  user: any;
}

const ManageSubscriptionModal = ({ 
  isOpen, 
  onClose, 
  subscription, 
  user 
}: ManageSubscriptionModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Mock billing data - in a real app, this would come from your backend
  const [billingInfo, setBillingInfo] = useState({
    paymentMethod: "Visa ending in 4242",
    cardExpiry: "12/2025",
    billingAddress: {
      line1: "123 Main St",
      line2: "Apt 4B",
      city: "San Francisco",
      state: "CA",
      zip: "94103",
      country: "United States"
    }
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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

  const getPlanName = () => {
    if (!subscription) return "No active plan";
    
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

  const getPlanPrice = () => {
    if (!subscription) return null;
    
    if (subscription.amount) {
      return `$${(subscription.amount / 100).toFixed(2)}`;
    } else if (subscription.price) {
      return `$${(subscription.price / 100).toFixed(2)}`;
    }
    
    return null;
  };

  const getBillingCycle = () => {
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

  const handleUpgradePlan = () => {
    window.open('/pricing', '_blank');
    onClose();
  };

  const handleCancelSubscription = () => {
    setIsLoading(true);
    // In a real app, this would call your API to cancel the subscription
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      onClose();
    }, 1500);
  };

  const handleUpdateBilling = () => {
    // In a real app, this would open a payment modal or redirect to a billing portal
    toast({
      title: "Billing update",
      description: "Redirecting to billing portal...",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
        <div className="relative">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="h-5 w-5" />
              Manage Subscription
            </DialogTitle>
            <DialogDescription>
              View and manage your subscription details
            </DialogDescription>
          </DialogHeader>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {/* Current Plan Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Current Plan
              </h3>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-lg">{getPlanName()}</span>
                    {getPlanPrice() && (
                      <p className="text-sm text-muted-foreground">
                        {getPlanPrice()} {getBillingCycle()}
                      </p>
                    )}
                  </div>
                  <Badge className={
                    subscription?.status === "active" 
                      ? "bg-green-600" 
                      : subscription?.status === "trialing" 
                        ? "bg-blue-600" 
                        : "bg-gray-600"
                  }>
                    {subscription?.status === "active" 
                      ? "Active" 
                      : subscription?.status === "trialing" 
                        ? "Trial" 
                        : "Inactive"}
                  </Badge>
                </div>
                
                {subscription?.current_period_end && (
                  <p className="text-sm text-muted-foreground">
                    {subscription.status === "trialing" 
                      ? `Trial ends on ${formatDate(subscription.current_period_end)}` 
                      : `Renews on ${formatDate(subscription.current_period_end)}`}
                  </p>
                )}
                
                {subscription?.status === "trialing" && subscription.current_period_end && (
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    {getDaysRemaining(subscription.current_period_end)} days remaining
                  </p>
                )}
              </div>
            </div>

            {/* Billing Information Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing Information
              </h3>
              
              <div className="space-y-4">
                {/* Payment Method */}
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{billingInfo.paymentMethod}</p>
                    <p className="text-xs text-muted-foreground">Expires {billingInfo.cardExpiry}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleUpdateBilling}
                    className="text-xs h-8"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Update
                  </Button>
                </div>
                
                {/* Billing Address */}
                <div className="flex justify-between items-start p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      Billing Address
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {billingInfo.billingAddress.line1}{billingInfo.billingAddress.line2 && `, ${billingInfo.billingAddress.line2}`}<br />
                      {billingInfo.billingAddress.city}, {billingInfo.billingAddress.state} {billingInfo.billingAddress.zip}<br />
                      {billingInfo.billingAddress.country}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleUpdateBilling}
                    className="text-xs h-8"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>

            {/* Subscription Actions Section */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Subscription Actions
              </h3>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleUpgradePlan}
                  className="w-full justify-between py-3"
                  variant="outline"
                >
                  <span>Change Plan</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {subscription?.status !== "trialing" && (
                  <Button 
                    onClick={handleCancelSubscription}
                    className="w-full justify-between py-3"
                    variant="outline"
                    disabled={isLoading}
                  >
                    <span className="text-red-600">Cancel Subscription</span>
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/20 flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={handleUpgradePlan}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSubscriptionModal;