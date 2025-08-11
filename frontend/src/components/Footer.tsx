import { BookOpen, Twitter, Instagram, Facebook, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const footerLinks = {
    company: [
      { name: "About Us", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Press", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Investors", href: "#" }
    ],
    product: [
      { name: "Features", href: "#" },
      { name: "Pricing", href: "#pricing" },
      { name: "Book Request", href: "#" },
      { name: "Mobile App", href: "#" },
      { name: "API", href: "#" }
    ],
    resources: [
      { name: "Help Center", href: "#" },
      { name: "Reading Guides", href: "#" },
      { name: "Author Interviews", href: "#" },
      { name: "Community", href: "#" },
      { name: "Book Clubs", href: "#" }
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "DMCA", href: "#" },
      { name: "Accessibility", href: "#" }
    ]
  };

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" },
    { name: "YouTube", icon: Youtube, href: "#" }
  ];

  return (
    <footer className="bg-gradient-to-br from-foreground to-primary text-background">
      <div className="container-custom">
        {/* Newsletter Section */}
        <div className="py-16 border-b border-background/20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Stay Updated with BookHub
            </h2>
            <p className="text-xl text-background/80 max-w-2xl mx-auto">
              Get weekly book recommendations, exclusive author interviews, and early access to new features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                placeholder="Enter your email"
                className="bg-background/10 border-background/20 text-background placeholder:text-background/60 focus:border-background/40"
              />
              <Button className="bg-background text-foreground hover:bg-background/90 px-8">
                Subscribe
              </Button>
            </div>
            <p className="text-sm text-background/60">
              No spam, unsubscribe at any time. We respect your privacy.
            </p>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-background" />
                <span className="text-2xl font-bold text-background">BookHub</span>
              </div>
              <p className="text-background/80 leading-relaxed">
                Discover your next favorite book with unlimited access to over 50,000 books, 
                magazines, and web novels. Reading has never been this accessible.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-background/60" />
                  <span className="text-sm text-background/80">hello@bookhub.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-background/60" />
                  <span className="text-sm text-background/80">1-800-BOOKHUB</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-background/60" />
                  <span className="text-sm text-background/80">San Francisco, CA</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors duration-200"
                      aria-label={social.name}
                    >
                      <IconComponent className="h-5 w-5 text-background" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Links Sections */}
            <div className="lg:col-span-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <h3 className="font-semibold text-background mb-4">Company</h3>
                  <ul className="space-y-3">
                    {footerLinks.company.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-background/80 hover:text-background transition-colors duration-200"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-background mb-4">Product</h3>
                  <ul className="space-y-3">
                    {footerLinks.product.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-background/80 hover:text-background transition-colors duration-200"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-background mb-4">Resources</h3>
                  <ul className="space-y-3">
                    {footerLinks.resources.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-background/80 hover:text-background transition-colors duration-200"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-background mb-4">Legal</h3>
                  <ul className="space-y-3">
                    {footerLinks.legal.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-background/80 hover:text-background transition-colors duration-200"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-background/60">
              © 2024 BookHub. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-background/60">
              <span>Made with ❤️ for book lovers</span>
              <div className="flex items-center space-x-4">
                <span>Available on:</span>
                <div className="flex space-x-2">
                  <div className="px-2 py-1 bg-background/10 rounded text-xs">iOS</div>
                  <div className="px-2 py-1 bg-background/10 rounded text-xs">Android</div>
                  <div className="px-2 py-1 bg-background/10 rounded text-xs">Web</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;