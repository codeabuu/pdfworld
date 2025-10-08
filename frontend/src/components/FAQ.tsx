import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Send, X } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const faqs = [
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Absolutely! You can cancel your BookHub subscription at any time with no cancellation fees. If you cancel during your free trial, you won't be charged. If you cancel after being billed, you'll continue to have access until the end of your current billing period."
    },
    {
      question: "How does the book request feature work?",
      answer: "Simply fill out our book request form with the title, author, and any additional details. Our team typically adds requested books to the library within 24-48 hours. We have a 98.5% success rate in fulfilling book requests, and it's completely free for all subscribers."
    },
    {
      question: "Can I read books offline?",
      answer: "Yes! All our plans include offline reading capabilities. You can download books to your device and read them without an internet connection. Downloads sync across all your devices when you're back online."
    },
    {
      question: "How many devices can I use?",
      answer: "The Basic plan allows reading on 2 devices, while Premium and Family plans offer unlimited device access. You can seamlessly switch between your phone, tablet, computer, and e-reader with automatic sync of your reading progress and bookmarks."
    },
    {
      question: "What's included in the free trial?",
      answer: "Your free trial includes full access to our entire library of 50,000+ books, magazines, and newspapers. You can use all features including offline reading, the book request feature, and reading on multiple devices. No credit card required to start."
    },
    {
      question: "Are there any hidden fees?",
      answer: "No hidden fees, ever! The price you see is exactly what you pay. There are no setup fees, cancellation fees, or overage charges. Even the book request feature is completely free for all subscribers."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes! We offer a 30-day money-back guarantee on all plans. If you're not completely satisfied with BookHub, contact us within 30 days of your purchase for a full refund, no questions asked."
    },
    {
      question: "How is the Family plan different?",
      answer: "The Family plan supports up to 6 individual accounts with separate reading profiles, recommendations, and progress tracking. It includes parental controls for kids' accounts, access to our curated children's library, and family reading challenges to encourage reading together."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Form submitted:", formData);
      // Here you would typically send the data to your backend
      alert("Thank you for your message! We'll get back to you within 24 hours.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setShowContactForm(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", subject: "", message: "" });
    setShowContactForm(false);
  };

  return (
    <section className="py-8 lg:py-12 bg-background">
      <div className="container-custom px-4">
        {/* Header - Mobile Optimized */}
        <div className="text-center space-y-3 mb-8 lg:mb-12">
          <div className="inline-flex items-center space-x-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-xs lg:text-sm font-medium">
            <HelpCircle className="h-3 w-3 lg:h-4 lg:w-4" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl lg:text-4xl font-bold text-foreground">
            Got Questions?
            <span className="text-primary block lg:inline"> We've Got Answers</span>
          </h2>
          <p className="text-base lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about BookHub.
            {/* <span className="text-primary block lg:inline"> Contact support if you need help.</span> */}
          </p>
        </div>

        {/* FAQ Accordion - Mobile Optimized */}
        <div className="max-w-4xl mx-auto space-y-3 lg:space-y-4 mb-8 lg:mb-12">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden border border-border/50 hover:border-border/80 transition-colors">
              <button
                className="w-full p-4 lg:p-6 text-left flex items-start justify-between hover:bg-secondary/20 transition-colors duration-200"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="text-sm lg:text-lg font-semibold text-foreground pr-3 lg:pr-4 leading-tight flex-1">
                  {faq.question}
                </h3>
                {openIndex === index ? (
                  <ChevronUp className="h-4 w-4 lg:h-5 lg:w-5 text-primary flex-shrink-0 mt-0.5" />
                ) : (
                  <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-4 lg:px-6 pb-4 lg:pb-6 border-t border-border/50">
                  <div className="pt-3 lg:pt-4">
                    <p className="text-muted-foreground leading-relaxed text-xs lg:text-sm">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Contact Support Dropdown */}
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/30 transition-colors">
            <button
              className="w-full p-6 text-left flex items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-colors"
              onClick={() => setShowContactForm(!showContactForm)}
            >
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
                <div className="text-left">
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">
                    Contact Support
                  </h3>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Can't find what you're looking for? Send us a message.
                  </p>
                </div>
              </div>
              {showContactForm ? (
                <ChevronUp className="h-5 w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 lg:h-6 lg:w-6 text-primary flex-shrink-0" />
              )}
            </button>
            
            {/* Contact Form */}
            {showContactForm && (
              <div className="p-6 border-t border-border/50 bg-background">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What is this regarding?"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please describe your issue or question in detail..."
                      rows={5}
                      className="w-full resize-vertical"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    We typically respond within 24 hours. For urgent issues, please mention "URGENT" in your subject line.
                  </p>
                </form>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Help Links - Mobile Only
        <div className="lg:hidden mt-8">
          <Card className="p-4 bg-secondary/20 border-dashed">
            <h4 className="font-semibold text-foreground text-sm mb-3">Quick Help</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button variant="ghost" size="sm" className="justify-start h-8 text-xs">
                📚 Getting Started
              </Button>
              <Button variant="ghost" size="sm" className="justify-start h-8 text-xs">
                💳 Billing Help
              </Button>
              <Button variant="ghost" size="sm" className="justify-start h-8 text-xs">
                📱 App Issues
              </Button>
              <Button variant="ghost" size="sm" className="justify-start h-8 text-xs">
                🔒 Account Help
              </Button>
            </div>
          </Card>
        </div> */}
      </div>
    </section>
  );
};

export default FAQ;