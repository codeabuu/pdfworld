import { Button } from "@/components/ui/button";
import { Play, Star, Users, BookOpen } from "lucide-react";
import heroImage from "@/assets/hero-books.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <div className="container-custom py-6 md:py-8">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center min-h-[400px] md:min-h-[600px]">
          {/* Left Content */}
          <div className="space-y-6 md:space-y-8 animate-fade-up order-2 lg:order-1">
            {/* Trust Badge */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-gold text-gold" />
                <Star className="h-4 w-4 fill-gold text-gold" />
                <Star className="h-4 w-4 fill-gold text-gold" />
                <Star className="h-4 w-4 fill-gold text-gold" />
                <Star className="h-4 w-4 fill-gold text-gold" />
              </div>
              <span className="text-center sm:text-left">Rated 4.9/5 by 10,000+ readers</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-hero bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight">
                Explore a World of Books—
                <span className="block">Instantly</span>
              </h1>
              <p className="text-base sm:text-lg md:text-subhero max-w-lg mx-auto lg:mx-0">
                Unlimited access to books, magazines & web novels. 
                <span className="text-foreground font-semibold"> Just $5/month.</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button className="btn-hero group text-sm sm:text-base py-3 sm:py-2">
                Start Free Trial
                <BookOpen className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform duration-300" />
              </Button>
              <Button variant="outline" className="group text-sm sm:text-base py-3 sm:py-2">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex justify-center lg:justify-start items-center space-x-4 sm:space-x-8 pt-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">50K+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Books</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">10K+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Readers</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">24/7</div>
                <div className="text-xs sm:text-sm text-muted-foreground">New Releases</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative animate-fade-up order-1 lg:order-2" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              <img
                src={heroImage}
                alt="Digital books floating in a magical reading environment"
                className="w-full h-auto rounded-xl md:rounded-2xl shadow-lg md:shadow-[var(--shadow-large)] animate-float max-w-md mx-auto lg:max-w-none"
              />
              {/* Floating UI Elements - Hidden on mobile, visible on medium screens and up */}
              <div className="hidden sm:block absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-primary text-primary-foreground px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold shadow-lg">
                Free Trial
              </div>
              <div className="hidden sm:block absolute -bottom-3 -left-3 md:-bottom-4 md:-left-4 bg-success text-success-foreground px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold shadow-lg flex items-center space-x-1 md:space-x-2">
                <Users className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline">Join 10K+ Readers</span>
                <span className="md:hidden">10K+</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorations - Smaller on mobile */}
      <div className="absolute top-10 left-5 w-12 h-12 md:top-20 md:left-10 md:w-20 md:h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-5 w-16 h-16 md:bottom-20 md:right-10 md:w-32 md:h-32 bg-accent/10 rounded-full blur-xl"></div>
    </section>
  );
};

export default Hero;