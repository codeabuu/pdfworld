import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Quote, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const Testimonials = () => {
  const [showAllReviews, setShowAllReviews] = useState(false);

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Graduate Student",
      avatar: "bg-purple-400",
      rating: 5,
      text: "BookHub has completely transformed my studying experience. The textbook request feature saved me hundreds of dollars this semester!",
      highlight: "Saved $400+ on textbooks"
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      avatar: "bg-blue-400",
      rating: 5,
      text: "I read 3-4 technical books per month, and BookHub's library has everything I need. The offline reading is perfect for my commute.",
      highlight: "50+ books read this year"
    },
    {
      name: "Emma Rodriguez",
      role: "Book Blogger",
      avatar: "bg-pink-400",
      rating: 5,
      text: "The early access to new releases is incredible! I can review books before they hit the shelves. My followers love the recommendations.",
      highlight: "Early access to 200+ titles"
    },
    {
      name: "David Park",
      role: "High School Teacher",
      avatar: "bg-green-400",
      rating: 5,
      text: "The family plan is perfect for our household. My kids love the curated children's section, and I enjoy the classic literature collection.",
      highlight: "Family of 5 readers"
    },
    {
      name: "Lisa Thompson",
      role: "Marketing Manager",
      avatar: "bg-amber-400",
      rating: 5,
      text: "I was skeptical about digital reading, but BookHub's interface is so comfortable. I actually prefer it to physical books now!",
      highlight: "Converted from print reader"
    },
    {
      name: "James Wilson",
      role: "Retired Professor",
      avatar: "bg-gray-600",
      rating: 5,
      text: "The magazine and newspaper access is fantastic. I can read publications from around the world. It's like having a global newsstand.",
      highlight: "100+ international publications"
    }
  ];

  const stats = [
    { number: "1M+", label: "Books", icon: "📚" },
    { number: "100K+", label: "Readers", icon: "😊" },
    { number: "98.5%", label: "Satisfied", icon: "⭐" },
    { number: "24/7", label: "Updates", icon: "🔄" }
  ];

  const displayedTestimonials = showAllReviews ? testimonials : testimonials.slice(0, 2);

  return (
    <section className="py-8 lg:py-12 bg-gradient-to-br from-secondary/20 to-accent/10">
      <div className="container-custom px-4">
        {/* Header - Mobile Optimized */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-3 py-1 rounded-full text-xs font-medium">
            <Star className="h-3 w-3" />
            <span>Loved by 10K+ Readers</span>
          </div>
          <h2 className="text-2xl lg:text-4xl font-bold text-foreground">
            What Our Readers
            <span className="text-primary"> Are Saying</span>
          </h2>
          <p className="text-base lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied readers who have transformed their reading experience
          </p>
        </div>

        {/* Stats Bar - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 mb-8 lg:mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center space-y-1 lg:space-y-2">
              <div className="text-2xl lg:text-4xl">{stat.icon}</div>
              <div className="text-xl lg:text-3xl font-bold text-foreground">{stat.number}</div>
              <div className="text-xs lg:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid - Mobile Optimized */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6">
          {displayedTestimonials.map((testimonial, index) => (
            <Card key={index} className="p-4 lg:p-6 hover:shadow-md transition-shadow">
              {/* Header - Mobile Optimized */}
              <div className="flex items-start justify-between mb-3 lg:mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`${testimonial.avatar} w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm lg:text-base`}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground text-sm lg:text-base truncate">
                      {testimonial.name}
                    </h4>
                    <p className="text-xs lg:text-sm text-muted-foreground truncate">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <Quote className="h-4 w-4 lg:h-6 lg:w-6 text-muted-foreground flex-shrink-0" />
              </div>

              {/* Rating - Mobile Optimized */}
              <div className="flex items-center space-x-1 mb-3 lg:mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 lg:h-4 lg:w-4 fill-gold text-gold" />
                ))}
              </div>

              {/* Content - Mobile Optimized */}
              <blockquote className="text-foreground mb-3 lg:mb-4 text-xs lg:text-sm leading-relaxed">
                "{testimonial.text}"
              </blockquote>

              {/* Highlight Badge - Mobile Optimized */}
              <Badge variant="secondary" className="text-xs">
                {testimonial.highlight}
              </Badge>
            </Card>
          ))}
        </div>

        {/* See All Reviews Button */}
        {testimonials.length > 2 && (
          <div className="flex justify-center mt-6 lg:mt-8">
            <Button
              variant="outline"
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="flex items-center gap-2"
            >
              {showAllReviews ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less Reviews
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  See All {testimonials.length} Reviews
                </>
              )}
            </Button>
          </div>
        )}

        {/* Call to Action - Mobile Optimized */}
        <div className="text-center mt-8 lg:mt-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs lg:text-sm font-medium mb-4 lg:mb-6">
            <Star className="h-3 w-3 lg:h-4 lg:w-4" />
            <span>Join Our Community</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3 lg:mb-4">
            Ready to Transform Your Reading?
          </h3>
          <p className="text-muted-foreground text-sm lg:text-base mb-4 lg:mb-6 max-w-md mx-auto">
            Start your free trial today and discover why thousands choose BookHub
          </p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;