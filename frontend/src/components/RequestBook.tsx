import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { BookPlus, Send, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RequestBook = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    toast({
      title: "Request Submitted!",
      description: "We'll notify you when your requested book is available.",
    });
    
    // Reset after 3 seconds
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <section className="section-padding bg-gradient-to-br from-secondary/20 to-accent/10">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <BookPlus className="h-4 w-4" />
              <span>Book Request Feature</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Can't Find Your Book?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Request any book and we'll add it to our library within 48 hours. 
              It's completely free for all subscribers!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Request Form */}
            <Card className="card-elevated p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Book Title *
                  </label>
                  <Input
                    placeholder="Enter the book title"
                    className="border-border focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Author Name
                  </label>
                  <Input
                    placeholder="Enter the author's name"
                    className="border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    ISBN (if available)
                  </label>
                  <Input
                    placeholder="978-1234567890"
                    className="border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Additional Notes
                  </label>
                  <Textarea
                    placeholder="Any additional information about the book..."
                    className="border-border focus:border-primary min-h-[100px]"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-hero"
                  disabled={isSubmitted}
                >
                  {isSubmitted ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Request Submitted!
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  We typically add requested books within 24-48 hours
                </p>
              </form>
            </Card>

            {/* Features & Stats */}
            <div className="space-y-8">
              {/* Success Stats */}
              <Card className="card-elevated p-6 bg-gradient-to-r from-success/10 to-success/5">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-success text-success-foreground p-3 rounded-lg">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Request Success Rate</h3>
                    <p className="text-success font-medium">98.5% fulfilled</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  We've successfully added over 5,000 requested books to our library
                </p>
              </Card>

              {/* Process Steps */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">How it Works</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Submit Your Request</h4>
                      <p className="text-sm text-muted-foreground">Fill out the form with book details</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">We Source the Book</h4>
                      <p className="text-sm text-muted-foreground">Our team locates and licenses the content</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Get Notified</h4>
                      <p className="text-sm text-muted-foreground">Receive an email when it's ready to read</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Requests */}
              <Card className="card-elevated p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recently Added</h3>
                <div className="space-y-3">
                  {[
                    { title: "The Innovation Stack", author: "Jim McKelvey", time: "2 hours ago" },
                    { title: "Digital Minimalism", author: "Cal Newport", time: "5 hours ago" },
                    { title: "The Midnight Library", author: "Matt Haig", time: "1 day ago" },
                  ].map((book, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{book.title}</span>
                        <span className="text-muted-foreground"> by {book.author}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{book.time}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RequestBook;