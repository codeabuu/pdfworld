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
    <section id="pricing" className="section-padding bg-background">
      {/* Profile Dropdown - Only show for authenticated users */}
      {isAuthenticated && (
        <div
          className="hidden sm:block absolute top-4 right-4 z-50"
          ref={profileDropdownRef}
        >
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
                {/* User Info */}
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
                    <span className="text-sm font-medium text-foreground">
                      Subscription
                    </span>
                    {subscription && getPlanBadge(subscription.status)}
                  </div>

                  {subscription?.status === "trialing" && subscription.trial_end && (
                    <p className="text-xs text-muted-foreground">
                      Trial ends:{" "}
                      {new Date(subscription.trial_end).toLocaleDateString()}
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

                {/* Logout */}
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
      )}

      <div className="container-custom">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4" />
            <span>Simple, Transparent Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Choose Your Reading <span className="text-primary"> Journey</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a free trial, then choose the plan that fits your reading
            lifestyle. Cancel anytime, no questions asked.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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

        {/* Price Comparison */}
        <div className="mt-16 text-center bg-muted/50 rounded-lg p-8">
          <h3 className="text-2xl font-semibold text-foreground mb-4">
            Yearly Plan Saves You 17%
          </h3>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">$60</div>
              <div className="text-sm text-muted-foreground">Monthly total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">$50</div>
              <div className="text-sm text-muted-foreground">Yearly total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">$10</div>
              <div className="text-sm text-muted-foreground">You save</div>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-16 pt-16 border-t border-border">
          <h3 className="text-2xl font-semibold text-center text-foreground mb-12">
            All plans include these amazing features
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Download,
                title: "Offline Reading",
                description: "Download books for reading without internet",
              },
              {
                icon: Smartphone,
                title: "Multi-Device Sync",
                description:
                  "Seamlessly switch between phone, tablet, and desktop",
              },
              {
                icon: Globe,
                title: "Global Library",
                description: "Access content from publishers worldwide",
              },
              {
                icon: BookOpen,
                title: "No Ads",
                description: "Enjoy uninterrupted reading experience",
              },
            ].map((feature, index) => {
              const IconComponent = feature.icon as any;
              return (
                <div key={index} className="text-center space-y-3">
                  <div className="inline-flex p-3 bg-secondary rounded-lg">
                    <IconComponent className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <h4 className="font-semibold text-foreground">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Questions?{" "}
            <span className="text-primary font-medium cursor-pointer hover:underline">
              See our FAQ
            </span>{" "}
            or{" "}
            <span className="text-primary font-medium cursor-pointer hover:underline">
              Contact support
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;