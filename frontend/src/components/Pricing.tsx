import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, BookOpen, Download, Smartphone, Globe, Gift } from "lucide-react";

const Pricing = () => {
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
        "No credit card required"
      ],
      ctaText: "Start Free Trial",
      popular: false
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
        "Book recommendations AI"
      ],
      ctaText: "Get Started",
      popular: true
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
        "Premium support 24/7"
      ],
      ctaText: "Save 17%",
      popular: false
    }
  ];

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
            <span className="text-primary"> Journey</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a free trial, then choose the plan that fits your reading lifestyle. 
            Cancel anytime, no questions asked.
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
                    <Badge className={`${
                      isFree 
                        ? "bg-success text-success-foreground" 
                        : isPopular 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-secondary-foreground"
                    } px-4 py-1`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="text-center space-y-4 mb-8">
                  <div className={`inline-flex p-3 rounded-lg ${
                    isFree 
                      ? "bg-success/10 text-success" 
                      : isPopular 
                      ? "bg-primary/10 text-primary" 
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    {isFree ? (
                      <div className="flex items-baseline justify-center space-x-1">
                        <span className="text-4xl font-bold text-success">Free</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center space-x-1">
                        <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-muted-foreground">/{plan.period}</span>
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
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className={`h-5 w-5 ${
                        isFree ? "text-success" : "text-primary"
                      } flex-shrink-0 mt-0.5`} />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full ${
                    isFree 
                      ? "bg-success hover:bg-success/90 text-success-foreground" 
                      : isPopular 
                      ? "btn-hero" 
                      : "btn-secondary hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {plan.ctaText}
                </Button>

                {/* Money Back Guarantee for paid plans */}
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
          {/* <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">$5</div>
              <div className="text-muted-foreground">Per month (monthly)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success">$4.17</div>
              <div className="text-muted-foreground">Per month (yearly)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">$10</div>
              <div className="text-muted-foreground">Total savings per year</div>
            </div>
          </div> */}
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

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Questions? <span className="text-primary font-medium cursor-pointer hover:underline">See our FAQ</span> or <span className="text-primary font-medium cursor-pointer hover:underline">Contact support</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;