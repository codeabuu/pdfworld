// components/HelpAndFAQ.tsx
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Mail, 
  Phone, 
  MessageCircle,
  Send,
  CheckCircle,
  Clock,
  User,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Header from "./Header.tsx";

const HelpAndFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general"
  });
  const { toast } = useToast();

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
    },
    {
      question: "How do I update my payment method?",
      answer: "Go to your Account Settings → Billing & Payments → Payment Methods. You can add, remove, or set default payment methods. All payment information is securely processed and encrypted."
    },
    {
      question: "What if I forget my password?",
      answer: "Click 'Forgot Password' on the login page. We'll send a password reset link to your email. The link expires in 1 hour for security purposes."
    }
  ];

  const contactCategories = [
    { value: "general", label: "General Inquiry" },
    { value: "billing", label: "Billing & Payments" },
    { value: "technical", label: "Technical Support" },
    { value: "feature", label: "Feature Request" },
    { value: "bug", label: "Report a Bug" },
    { value: "account", label: "Account Issues" }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call - replace with your actual endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send to your backend
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      setIsSubmitted(true);
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
        variant: "default",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general"
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Message Sent Successfully!
            </h2>
            <p className="text-muted-foreground mb-8">
              Thank you for reaching out. Our support team will get back to you within 24 hours. 
              We appreciate your patience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => setIsSubmitted(false)} className="btn-primary">
                Send Another Message
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Return Home
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <HelpCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            How can we help you today?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team. 
            We're here to help you get the most out of BookHub.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ Section - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  Frequently Asked Questions
                </h2>
              </div>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index} className="card-elevated overflow-hidden border-border/50">
                    <button
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-secondary/30 transition-colors duration-200"
                      onClick={() => toggleFAQ(index)}
                    >
                      <h3 className="text-lg font-semibold text-foreground pr-4">
                        {faq.question}
                      </h3>
                      {openIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    
                    {openIndex === index && (
                      <div className="px-6 pb-6 border-t border-border/50">
                        <div className="pt-4">
                          <p className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form Section - 1/3 width */}
          <div className="lg:col-span-1">
            <Card className="card-elevated p-6 sticky top-6">
              <div className="flex items-center space-x-3 mb-6">
                <MessageCircle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  Contact Support
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Your Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                  >
                    {contactCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your issue"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Please describe your issue in detail..."
                    className="w-full resize-vertical"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>

              {/* Support Information */}
              <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>support@bookhub.com</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>24/7 Support Available</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Help Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center card-elevated">
            <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get detailed help with complex issues
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Email Us
            </Button>
          </Card>

          <Card className="p-6 text-center card-elevated">
            <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Instant help during business hours
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Start Chat
            </Button>
          </Card>

          <Card className="p-6 text-center card-elevated">
            <HelpCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Help Center</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Browse articles and tutorials
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Visit Help Center
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HelpAndFAQ;