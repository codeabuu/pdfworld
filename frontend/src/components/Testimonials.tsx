import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
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
    { number: "50K+", label: "Books Available", icon: "📚" },
    { number: "10K+", label: "Happy Readers", icon: "😊" },
    { number: "98.5%", label: "Satisfaction Rate", icon: "⭐" },
    { number: "24/7", label: "New Content Added", icon: "🔄" }
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-secondary/20 to-accent/10">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium">
            <Star className="h-4 w-4" />
            <span>Loved by 10,000+ Readers</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            What Our Readers
            <span className="text-primary"> Are Saying</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied readers who have transformed their reading experience with BookHub
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center space-y-2">
              <div className="text-4xl">{stat.icon}</div>
              <div className="text-3xl font-bold text-foreground">{stat.number}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="card-elevated p-6 hover-lift">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`${testimonial.avatar} w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold`}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <Quote className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-foreground mb-4 text-sm leading-relaxed">
                "{testimonial.text}"
              </blockquote>

              {/* Highlight Badge */}
              <Badge variant="secondary" className="text-xs">
                {testimonial.highlight}
              </Badge>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            <span>Join Our Happy Community</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to Transform Your Reading Experience?
          </h3>
          <p className="text-muted-foreground mb-6">
            Start your free trial today and discover why thousands of readers choose BookHub
          </p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;