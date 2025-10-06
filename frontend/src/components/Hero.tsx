import { Button } from "@/components/ui/button";
import { Play, Star, Users, BookOpen } from "lucide-react";
import heroImage from "@/assets/hero-books.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-up">
            {/* Trust Badge */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-gold text-gold" />
                <Star className="h-4 w-4 fill-gold text-gold" />
                <Star className="h-4 w-4 fill-gold text-gold" />
                <Star className="h-4 w-4 fill-gold text-gold" />
                <Star className="h-4 w-4 fill-gold text-gold" />
              </div>
              <span>Rated 4.9/5 by 10,000+ readers</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-hero bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Explore a World of Books—
                <span className="block">Instantly</span>
              </h1>
              <p className="text-subhero max-w-lg">
                Unlimited access to books, magazines & web novels. 
                <span className="text-foreground font-semibold"> Just $5/month.</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="btn-hero group">
                Start Free Trial
                <BookOpen className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              </Button>
              <Button className="btn-secondary group">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-muted-foreground">Books Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">10K+</div>
                <div className="text-sm text-muted-foreground">Happy Readers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">New Releases</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              <img
                src={heroImage}
                alt="Digital books floating in a magical reading environment"
                className="w-full h-auto rounded-2xl shadow-[var(--shadow-large)] animate-float"
              />
              {/* Floating UI Elements */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                Free Trial Available
              </div>
              <div className="absolute -bottom-4 -left-4 bg-success text-success-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Join 10K+ Readers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl"></div>
    </section>
  );
};

export default Hero;