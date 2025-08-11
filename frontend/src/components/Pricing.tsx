import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Star, Zap, Crown, BookOpen, Download, Smartphone, Globe } from "lucide-react";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Basic",
      description: "Perfect for casual readers",
      monthlyPrice: 5,
      yearlyPrice: 50,
      icon: BookOpen,
      badge: null,
      features: [
        "Access to 50,000+ books",
        "Magazine & newspaper access",
        "Basic search & filters",
        "Read on 2 devices",
        "Download for offline reading",
        "Customer support"
      ]
    },
    {
      name: "Premium",
      description: "Most popular for avid readers",
      monthlyPrice: 12,
      yearlyPrice: 120,
      icon: Star,
      badge: "Most Popular",
      features: [
        "Everything in Basic",
        "Unlimited device access",
        "Early access to new releases",
        "Book request feature",
        "Advanced reading analytics",
        "Priority customer support",
        "Exclusive author interviews",
        "Book recommendations AI"
      ]
    },
    {
      name: "Family",
      description: "Share the love of reading",
      monthlyPrice: 20,
      yearlyPrice: 200,
      icon: Crown,
      badge: "Best Value",
      features: [
        "Everything in Premium",
        "Up to 6 family accounts",
        "Parental controls",
        "Kids' library access",
        "Family reading challenges",
        "Shared reading lists",
        "Multiple reading profiles",
        "Family usage insights"
      ]
    }
  ];

  const savings = (monthly: number, yearly: number) => {
    const monthlyCost = monthly * 12;
    const savedAmount = monthlyCost - yearly;
    const savedPercentage = Math.round((savedAmount / monthlyCost) * 100);
    return { savedAmount, savedPercentage };
  };

  return (
    <section id="pricing" className="section-padding bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4" />
            <span>Simple, Transparent Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Choose Your Reading 
            <span className="text-primary"> Adventure</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a free trial, then pick the perfect plan for your reading habits. 
            Cancel anytime, no questions asked.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          <span className={`font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-primary"
          />
          <span className={`font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly
          </span>
          {isYearly && (
            <Badge className="bg-success text-success-foreground ml-2">
              Save up to 17%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const period = isYearly ? "year" : "month";
            const savingsData = savings(plan.monthlyPrice, plan.yearlyPrice);
            const isPopular = plan.badge === "Most Popular";

            return (
              <Card
                key={index}
                className={`relative p-8 transition-all duration-300 hover-lift ${
                  isPopular
                    ? "ring-2 ring-primary shadow-[var(--shadow-glow)] scale-105"
                    : "card-elevated hover:shadow-[var(--shadow-medium)]"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className={`${
                      isPopular 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-success text-success-foreground"
                    } px-4 py-1`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="text-center space-y-4 mb-8">
                  <div className={`inline-flex p-3 rounded-lg ${
                    isPopular ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                  }`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-4xl font-bold text-foreground">${price}</span>
                      <span className="text-muted-foreground">/{period}</span>
                    </div>
                    {isYearly && savingsData.savedAmount > 0 && (
                      <p className="text-sm text-success font-medium">
                        Save ${savingsData.savedAmount}/year ({savingsData.savedPercentage}% off)
                      </p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full ${
                    isPopular 
                      ? "btn-hero" 
                      : "btn-secondary hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {index === 0 ? "Start Free Trial" : "Get Started"}
                </Button>

                {/* Money Back Guarantee */}
                <p className="text-xs text-muted-foreground text-center mt-4">
                  30-day money-back guarantee
                </p>
              </Card>
            );
          })}
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
                description: "Download books for reading without internet"
              },
              {
                icon: Smartphone,
                title: "Multi-Device Sync",
                description: "Seamlessly switch between phone, tablet, and desktop"
              },
              {
                icon: Globe,
                title: "Global Library",
                description: "Access content from publishers worldwide"
              },
              {
                icon: BookOpen,
                title: "No Ads",
                description: "Enjoy uninterrupted reading experience"
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center space-y-3">
                  <div className="inline-flex p-3 bg-secondary rounded-lg">
                    <IconComponent className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <h4 className="font-semibold text-foreground">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;