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
  AlertCircle,
  Trash2,
  Check,
  Plus,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { cardService, Card } from "@/services/cardService";

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
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);
  const { toast } = useToast();

  // Load user's cards when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserCards();
    }
  }, [isOpen, user]);

  const loadUserCards = async () => {
    if (!user?.id) return;
    
    setIsLoadingCards(true);
    try {
      const userCards = await cardService.getCustomerCards(user.id);
      setCards(userCards);
    } catch (error: any) {
      console.error("Failed to load cards:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCards(false);
    }
  };

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

  const handleAddCard = async () => {
    if (!user?.id || !user?.email) {
      toast({
        title: "Error",
        description: "User information missing",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingCard(true);
    try {
      const result = await cardService.initializeCardUpdate(user.email, user.id, "add");
      
      // Redirect to Paystack for card addition
      window.open(result.authorization_url, "_blank");
      
      toast({
        title: "Add Payment Method",
        description: "Redirecting to secure payment page...",
      });
      
    } catch (error: any) {
      console.error("Failed to add card:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initialize card addition",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingCard(false);
    }
  };

  const handleSetDefaultCard = async (cardId: number) => {
    if (!user?.id) return;

    setIsUpdatingCard(true);
    try {
      await cardService.setDefaultCard(user.id, cardId);
      
      // Update local state
      setCards(cards.map(card => ({
        ...card,
        is_default: card.id === cardId
      })));
      
      toast({
        title: "Success",
        description: "Default payment method updated",
      });
      
    } catch (error: any) {
      console.error("Failed to set default card:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update default card",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingCard(false);
    }
  };

  const handleRemoveCard = async (cardId: number, last4: string) => {
    if (!user?.id) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to remove card ending with ${last4}?`)) {
      return;
    }

    setIsUpdatingCard(true);
    try {
      await cardService.removeCard(user.id, cardId);
      
      // Update local state
      setCards(cards.filter(card => card.id !== cardId));
      
      toast({
        title: "Success",
        description: "Payment method removed",
      });
      
    } catch (error: any) {
      console.error("Failed to remove card:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove card",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingCard(false);
    }
  };

  const handleRefreshCards = () => {
    loadUserCards();
    toast({
      title: "Refreshing",
      description: "Updating payment methods...",
    });
  };

  const handleUpgradePlan = () => {
    window.open('/pricing', '_blank');
    onClose();
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscriptions/cancel/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      onClose();
    } catch (error: any) {
      console.error("Failed to cancel subscription:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'verve': return '💳';
      default: return '💳';
    }
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
              View and manage your subscription and payment methods
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

            {/* Payment Methods Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Methods
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefreshCards}
                  disabled={isLoadingCards}
                  className="text-xs h-8"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingCards ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              <div className="space-y-3">
                {isLoadingCards ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading payment methods...</p>
                  </div>
                ) : cards.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed rounded-lg">
                    <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No payment methods saved</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddCard}
                      disabled={isUpdatingCard}
                      className="mt-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Payment Method
                    </Button>
                  </div>
                ) : (
                  <>
                    {cards.map((card) => (
                      <div key={card.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm">{getCardIcon(card.card_type)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {card.card_type} ending in {card.last4}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expires {card.exp_month}/{card.exp_year}
                              {card.is_default && (
                                <span className="ml-2 text-green-600">• Default</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {!card.is_default && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefaultCard(card.id)}
                              disabled={isUpdatingCard}
                              className="h-8 px-2 text-xs"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Set Default
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCard(card.id, card.last4)}
                            disabled={isUpdatingCard || (cards.length === 1 && card.is_default)}
                            className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddCard}
                      disabled={isUpdatingCard}
                      className="w-full mt-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Another Payment Method
                    </Button>
                  </>
                )}
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