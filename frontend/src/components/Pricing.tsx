import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Zap,
  Crown,
  BookOpen,
  Download,
  Smartphone,
  Globe,
  Gift,
  Loader2,
  User,
  ChevronDown,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { startPaidSubscription } from "@/lib/api";
import { authService } from "@/services/Myauthservice";
import { useToast } from "@/components/ui/use-toast";
import {
  setIntendedSubscription,
  getIntendedSubscription,
  clearIntendedSubscription,
  shouldContinueSubscription,
} from "@/utils/subRedirect";
import { subscriptionService } from "@/services/subservice";
import axios from "axios";
import ManageSubscriptionModal from "./ManageSubscriptionModal";
import ProfileSettingsModal from "./ProfileSetModal";

const API_BASE_URL = "http://127.0.0.1:8000";

interface UserData {
  id: string;
  email: string;
  created_at?: string;
}

interface SubscriptionState {
  has_access: boolean;
  status: "active" | "trialing" | "past_due" | "canceled" | string;
  trial_end?: string;
  in_trial?: boolean;
  trial_has_ended?: boolean;
  message?: string;
}

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  // ---- Profile dropdown: click outside to close ----
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---- Check authentication and fetch user & subscription for profile badge ----
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const authStatus = await authService.checkAuth();
        setIsAuthenticated(authStatus);
        
        if (!authStatus) return;

        const userId = authService.getUserId();
        if (!userId) return;

        try {
          const res = await axios.get(`${API_BASE_URL}/api/me/`);
          const userData = res.data.user || res.data;
          const userEmail = userData.email || "Unknown";

          setUser({
            id: userId,
            email: userEmail,
            created_at: userData.created_at,
          });

          const subData = await subscriptionService.checkSubscriptionStatus(userId);
          setSubscription(subData);
        } catch (err) {
          console.error("Failed to fetch user/subscription:", err);
          setUser({
            id: userId,
            email: "Unknown",
          });
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
      }
    };

    fetchUserData();
  }, []);

  // ---- Continue intended action after login (monthly/yearly/free_trial) ----
  useEffect(() => {
    const checkAndContinue = async () => {
      if (!shouldContinueSubscription()) return;

      setIsCheckingAuth(true);
      const isAuthenticated = await authService.checkAuth();

      if (!isAuthenticated) {
        clearIntendedSubscription();
        setIsCheckingAuth(false);
        return;
      }

      const userId = authService.getUserId();
      if (!userId) {
        clearIntendedSubscription();
        setIsCheckingAuth(false);
        return;
      }

      // If user already has access, bail to dashboard.
      try {
        const status = await subscriptionService.checkSubscriptionStatus(userId);
        if (status.has_access) {
          toast({
            title: "Welcome back!",
            description: "You already have an active subscription.",
          });
          clearIntendedSubscription();
          navigate("/dashboard");
          setIsCheckingAuth(false);
          return;
        }
      } catch (e) {
        console.error("Subscription check failed:", e);
      }

      const intended = getIntendedSubscription();
      if (intended === "monthly" || intended === "yearly") {
        await handleSubscribe(intended, true);
      } else if (intended === "trial") {
        await handleFreeTrial(true);
      }

      setIsCheckingAuth(false);
    };

    checkAndContinue();
  }, []);

  // ---- Helpers ----
  const getPlanBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 text-xs">Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-600 text-xs">Free Trial</Badge>;
      case "past_due":
        return <Badge className="bg-amber-600 text-xs">Past Due</Badge>;
      case "canceled":
        return (
          <Badge variant="outline" className="text-xs">
            Canceled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Inactive
          </Badge>
        );
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsProfileDropdownOpen(false);
      setIsAuthenticated(false);
      setUser(null);
      setSubscription(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ---- Paid subscription flow ----
  const handleSubscribe = async (
    planType: "monthly" | "yearly",
    isAutoContinue = false
  ) => {
    if (!isAutoContinue) setLoading(planType);

    try {
      const isAuthenticated = await authService.checkAuth();
      const userId = authService.getUserId();

      if (!isAuthenticated || !userId) {
        if (!isAutoContinue) {
          setIntendedSubscription(planType);
          navigate("/login", {
            state: {
              message: `Please sign in to continue with your ${planType} subscription`,
            },
          });
        }
        return;
      }

      const subscriptionStatus = await subscriptionService.checkSubscriptionStatus(userId);
      if (subscriptionStatus.has_access) {
        toast({
          title: "Active Subscription",
          description:
            "You already have an active subscription. Redirecting to dashboard...",
        });
        navigate("/dashboard");
        return;
      }

      // (Optional) Pull real email if you want; fallback keeps it simple
      const userEmail = `user_${userId}@example.com`;

      const result = await startPaidSubscription(userEmail, userId, planType);
      clearIntendedSubscription();
      window.location.href = result.authorization_url;
    } catch (error: any) {
      console.error("Subscription error:", error);
      if (!isAutoContinue) {
        toast({
          title: "Subscription failed",
          description:
            error?.message || "Failed to start subscription. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (!isAutoContinue) setLoading(null);
    }
  };

  // ---- Free trial flow (mirrors StartTrial.tsx) ----
  const handleFreeTrial = async (isAutoContinue = false) => {
    if (!isAutoContinue) setLoading("free");
    try {
      const isAuthenticated = await authService.checkAuth();
      if (!isAuthenticated) {
        if (!isAutoContinue) {
          setIntendedSubscription("trial");
          navigate("/login", {
            state: { message: "Please sign in to start your free trial" },
          });
        }
        return;
      }

      const userId = authService.getUserId();
      if (!userId) throw new Error("User not found");

      // Check trial eligibility
      const eligibility = await subscriptionService.checkTrialEligibility(userId);
      if (!eligibility.eligible) {
        if (!isAutoContinue) {
          toast({
            title: "Not Eligible",
            description:
              eligibility.message || "You are not eligible for a free trial.",
            variant: "destructive",
          });
        }
        clearIntendedSubscription();
        return;
      }

      // Pull user email
      let userEmail = `user_${userId}@example.com`;
      try {
        const response = await axios.get(`${API_BASE_URL}/api/me/`);
        const userData = response.data.user || response.data;
        userEmail = userData.email || userEmail;
      } catch (e) {
        console.warn("Could not fetch user email, using fallback.");
      }

      // Start trial
      const result = await subscriptionService.startTrial(userId, userEmail);
      clearIntendedSubscription();
      window.location.href = result.authorization_url;
    } catch (error: any) {
      console.error("Free trial start failed:", error);
      if (!isAutoContinue) {
        toast({
          title: "Trial Error",
          description: error?.message || "Failed to start trial. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (!isAutoContinue) setLoading(null);
    }
  };

  const togglePlanExpansion = (index: number) => {
    setExpandedPlan(expandedPlan === index ? null : index);
  };

  const plans = [
    {
      name: "Free Trial",
      description: "Experience everything for 7 days",
      price: 0,
      period: "7 days",
      icon: Gift,
      badge: "7 Days Free",
      features: [
        "Full access to all features",
        "50,000+ books & magazines",
        "Download for offline reading",
        "Multi-device access",
        "Advanced search & filters",
        "No credit card required",
      ],
      ctaText: "Start Free Trial",
      popular: false,
      onClick: () => handleFreeTrial(false),
      loading: loading === "free",
    },
    {
      name: "Monthly",
      description: "Perfect for flexible reading",
      price: 5,
      period: "per month",
      icon: BookOpen,
      badge: "Most Flexible",
      features: [
        "Everything in Free Trial",
        "Unlimited book access",
        "Early access to new releases",
        "Book request feature",
        "Advanced reading analytics",
        "Priority customer support",
        "Exclusive author interviews",
        "Book recommendations AI",
      ],
      ctaText: "Get Started",
      popular: true,
      onClick: () => handleSubscribe("monthly"),
      loading:
        loading === "monthly" ||
        (isCheckingAuth && getIntendedSubscription() === "monthly"),
    },
    {
      name: "Yearly",
      description: "Best value for avid readers",
      price: 50,
      period: "per year",
      icon: Crown,
      badge: "Best Value",
      features: [
        "Everything in Monthly",
        "Save $10 vs monthly",
        "Priority feature requests",
        "Dedicated account manager",
        "Custom reading lists",
        "Family sharing (up to 3 users)",
        "Annual reading report",
        "Premium support 24/7",
      ],
      ctaText: "Save 17%",
      popular: false,
      onClick: () => handleSubscribe("yearly"),
      loading:
        loading === "yearly" ||
        (isCheckingAuth && getIntendedSubscription() === "yearly"),
    },
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-lg">Continuing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <section id="pricing" className="pt-4 pb-8 bg-background">
      <div className="container-custom">
        {/* Header - Mobile Optimized */}
        <div className="text-center space-y-4 mb-8 px-4">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4" />
            <span>Simple Pricing</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Choose Your Reading <span className="text-primary">Journey</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with a free trial, upgrade when ready
          </p>
        </div>

        {/* 📱 MOBILE VIEW - Compact Cards */}
        <div className="block lg:hidden space-y-4 px-4">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const isPopular = plan.popular;
            const isFree = plan.name === "Free Trial";
            const isExpanded = expandedPlan === index;

            return (
              <Card
                key={index}
                className={`relative p-4 transition-all duration-300 border-2 ${
                  isPopular
                    ? "border-primary bg-primary/5"
                    : isFree
                    ? "border-success/20 bg-success/5"
                    : "border-border"
                }`}
              >
                {/* Plan Header - Always Visible */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isFree
                          ? "bg-success/10 text-success"
                          : isPopular
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-foreground text-lg">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Price & Expand Button */}
                  <div className="text-right flex items-center gap-2">
                    <div>
                      {isFree ? (
                        <span className="text-2xl font-bold text-success">Free</span>
                      ) : (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-foreground">
                            ${plan.price}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {plan.period}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePlanExpansion(index)}
                      className="p-1 h-8 w-8"
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                {/* Badge */}
                {plan.badge && (
                  <Badge
                    className={`absolute -top-2 left-4 ${
                      isFree
                        ? "bg-success text-success-foreground"
                        : isPopular
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    } text-xs`}
                  >
                    {plan.badge}
                  </Badge>
                )}

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="space-y-4 mt-4 border-t pt-4">
                    {/* Features */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-foreground">
                        What's included:
                      </h4>
                      {plan.features.slice(0, 4).map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-start gap-2"
                        >
                          <Check
                            className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              isFree ? "text-success" : "text-primary"
                            }`}
                          />
                          <span className="text-sm text-foreground">
                            {feature}
                          </span>
                        </div>
                      ))}
                      {plan.features.length > 4 && (
                        <div className="text-xs text-muted-foreground">
                          + {plan.features.length - 4} more features
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      onClick={plan.onClick}
                      disabled={plan.loading}
                      className={`w-full ${
                        isFree
                          ? "bg-success hover:bg-success/90 text-success-foreground"
                          : isPopular
                          ? "btn-hero"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      }`}
                      size="lg"
                    >
                      {plan.loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.ctaText
                      )}
                    </Button>

                    {/* Guarantee */}
                    {!isFree && (
                      <p className="text-xs text-muted-foreground text-center">
                        30-day money-back guarantee
                      </p>
                    )}
                  </div>
                )}

                {/* Collapsed CTA */}
                {!isExpanded && (
                  <Button
                    onClick={plan.onClick}
                    disabled={plan.loading}
                    className={`w-full mt-2 ${
                      isFree
                        ? "bg-success hover:bg-success/90 text-success-foreground"
                        : isPopular
                        ? "btn-hero"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                  >
                    {plan.loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      plan.ctaText
                    )}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        {/* 💻 DESKTOP VIEW - Keep Original Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const isPopular = plan.popular;
            const isFree = plan.name === "Free Trial";

            return (
              <Card
                key={index}
                className={`relative p-8 transition-all duration-300 hover-lift ${
                  isPopular
                    ? "ring-2 ring-primary shadow-[var(--shadow-glow)] scale-105 border-primary/20"
                    : "card-elevated hover:shadow-[var(--shadow-medium)] border-border"
                } ${isFree ? "border-success/20" : ""}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge
                      className={`${
                        isFree
                          ? "bg-success text-success-foreground"
                          : isPopular
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      } px-4 py-1`}
                    >
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="text-center space-y-4 mb-8">
                  <div
                    className={`inline-flex p-3 rounded-lg ${
                      isFree
                        ? "bg-success/10 text-success"
                        : isPopular
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    {isFree ? (
                      <div className="flex items-baseline justify-center space-x-1">
                        <span className="text-4xl font-bold text-success">
                          Free
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center space-x-1">
                        <span className="text-4xl font-bold text-foreground">
                          ${plan.price}
                        </span>
                        <span className="text-muted-foreground">
                          /{plan.period}
                        </span>
                      </div>
                    )}
                    {plan.name === "Yearly" && (
                      <p className="text-sm text-success font-medium">
                        (save 17%)
                      </p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature: string, featureIndex: number) => (
                    <div
                      key={featureIndex}
                      className="flex items-start space-x-3"
                    >
                      <Check
                        className={`h-5 w-5 ${
                          isFree ? "text-success" : "text-primary"
                        } flex-shrink-0 mt-0.5`}
                      />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  onClick={plan.onClick}
                  disabled={plan.loading}
                  className={`w-full ${
                    isFree
                      ? "bg-success hover:bg-success/90 text-success-foreground"
                      : isPopular
                      ? "btn-hero"
                      : "btn-secondary hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {plan.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.ctaText
                  )}
                </Button>

                {/* Guarantee */}
                {!isFree && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    30-day money-back guarantee
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {/* Price Comparison - Mobile Optimized */}
        <div className="mt-12 text-center bg-muted/50 rounded-xl p-6 mx-4 lg:mx-0">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Yearly Plan Saves You 17%
          </h3>
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">$60</div>
              <div className="text-xs text-muted-foreground">Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-success">$50</div>
              <div className="text-xs text-muted-foreground">Yearly</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">$10</div>
              <div className="text-xs text-muted-foreground">Saved</div>
            </div>
          </div>
        </div>

        {/* Additional Features - Mobile Optimized */}
        <div className="mt-12 pt-12 border-t border-border px-4 lg:px-0">
          <h3 className="text-xl font-semibold text-center text-foreground mb-8">
            All plans include:
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {[
              {
                icon: Download,
                title: "Offline Reading",
                description: "Read without internet",
              },
              {
                icon: Smartphone,
                title: "Multi-Device",
                description: "Sync across devices",
              },
              {
                icon: Globe,
                title: "Global Library",
                description: "Worldwide content",
              },
              {
                icon: BookOpen,
                title: "No Ads",
                description: "Uninterrupted reading",
              },
            ].map((feature, index) => {
              const IconComponent = feature.icon as any;
              return (
                <div key={index} className="text-center space-y-2">
                  <div className="inline-flex p-2 bg-secondary rounded-lg">
                    <IconComponent className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ - Mobile Optimized */}
        <div className="mt-12 text-center px-4 lg:px-0">
          <p className="text-muted-foreground text-sm">
            Questions?{" "}
            <span className="text-primary font-medium cursor-pointer hover:underline">
              FAQ
            </span>{" "}
            or{" "}
            <span className="text-primary font-medium cursor-pointer hover:underline">
              Support
            </span>
          </p>
          <ProfileSettingsModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={user}
            subscription={subscription}
          />
          <ManageSubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            subscription={subscription}
            user={user}
          />
        </div>
      </div>
    </section>
  );
};

export default Pricing;