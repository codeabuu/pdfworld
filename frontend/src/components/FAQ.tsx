import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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

  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
            <HelpCircle className="h-4 w-4" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Got Questions?
            <span className="text-primary"> We've Got Answers</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about BookHub. Can't find what you're looking for? 
            <span className="text-primary"> Contact our support team.</span>
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="card-elevated overflow-hidden">
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

        {/* Contact Support */}
        <div className="text-center mt-16">
          <Card className="card-elevated p-8 max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-accent/5">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our friendly support team is here to help. Get in touch and we'll get back to you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-accent">
                Contact Support
              </Button>
              <Button variant="outline" className="hover-lift">
                Browse Help Center
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FAQ;