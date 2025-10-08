import { BookOpen, Twitter, Instagram, Facebook, Youtube, Mail, MapPin, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Footer = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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

  // const socialLinks = [
  //   { name: "Twitter", icon: Twitter, href: "#" },
  //   { name: "Instagram", icon: Instagram, href: "#" },
  //   { name: "Facebook", icon: Facebook, href: "#" },
  //   { name: "YouTube", icon: Youtube, href: "#" }
  // ];

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <footer className="bg-gradient-to-br from-foreground to-primary text-background">
      <div className="container-custom px-4">
        {/* Newsletter Section - Mobile Optimized */}

        {/* Main Footer Content - Mobile Optimized */}
        <div className="py-12 lg:py-16">
          <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-6 lg:gap-8">
            {/* Brand Section - Always Visible */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 lg:h-8 lg:w-8 text-background" />
                <span className="text-xl lg:text-2xl font-bold text-background">BookHub</span>
              </div>
              <p className="text-background/80 leading-relaxed text-sm lg:text-base">
                Discover your next favorite book with unlimited access to over 50,000 books, 
                magazines, and web novels.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-2 lg:space-y-3">
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

            </div>

            {/* Links Sections - Accordion on Mobile */}
            <div className="lg:col-span-4 space-y-4 lg:space-y-0">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
                {/* Company Section */}
                <div className="lg:border-0 border-b border-background/20 lg:pb-0 pb-4">
                  <button
                    onClick={() => toggleSection('company')}
                    className="w-full flex items-center justify-between lg:justify-start lg:pointer-events-none"
                  >
                    <h3 className="font-semibold text-background text-base lg:text-lg">Company</h3>
                    <div className="lg:hidden">
                      {openSections.company ? (
                        <ChevronUp className="h-4 w-4 text-background" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-background" />
                      )}
                    </div>
                  </button>
                  <ul className={`space-y-2 lg:space-y-3 mt-3 lg:mt-4 ${openSections.company ? 'block' : 'hidden lg:block'}`}>
                    {footerLinks.company.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-background/80 hover:text-background transition-colors duration-200 block py-1 lg:py-0"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Product Section */}
                <div className="lg:border-0 border-b border-background/20 lg:pb-0 pb-4">
                  <button
                    onClick={() => toggleSection('product')}
                    className="w-full flex items-center justify-between lg:justify-start lg:pointer-events-none"
                  >
                    <h3 className="font-semibold text-background text-base lg:text-lg">Product</h3>
                    <div className="lg:hidden">
                      {openSections.product ? (
                        <ChevronUp className="h-4 w-4 text-background" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-background" />
                      )}
                    </div>
                  </button>
                  <ul className={`space-y-2 lg:space-y-3 mt-3 lg:mt-4 ${openSections.product ? 'block' : 'hidden lg:block'}`}>
                    {footerLinks.product.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-background/80 hover:text-background transition-colors duration-200 block py-1 lg:py-0"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resources Section */}
                <div className="lg:border-0 border-b border-background/20 lg:pb-0 pb-4">
                  <button
                    onClick={() => toggleSection('resources')}
                    className="w-full flex items-center justify-between lg:justify-start lg:pointer-events-none"
                  >
                    <h3 className="font-semibold text-background text-base lg:text-lg">Resources</h3>
                    <div className="lg:hidden">
                      {openSections.resources ? (
                        <ChevronUp className="h-4 w-4 text-background" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-background" />
                      )}
                    </div>
                  </button>
                  <ul className={`space-y-2 lg:space-y-3 mt-3 lg:mt-4 ${openSections.resources ? 'block' : 'hidden lg:block'}`}>
                    {footerLinks.resources.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-background/80 hover:text-background transition-colors duration-200 block py-1 lg:py-0"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Legal Section */}
                <div className="lg:pb-0">
                  <button
                    onClick={() => toggleSection('legal')}
                    className="w-full flex items-center justify-between lg:justify-start lg:pointer-events-none"
                  >
                    <h3 className="font-semibold text-background text-base lg:text-lg">Legal</h3>
                    <div className="lg:hidden">
                      {openSections.legal ? (
                        <ChevronUp className="h-4 w-4 text-background" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-background" />
                      )}
                    </div>
                  </button>
                  <ul className={`space-y-2 lg:space-y-3 mt-3 lg:mt-4 ${openSections.legal ? 'block' : 'hidden lg:block'}`}>
                    {footerLinks.legal.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-background/80 hover:text-background transition-colors duration-200 block py-1 lg:py-0"
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

        {/* Bottom Bar - Mobile Optimized */}
        <div className="py-6 lg:py-8 border-t border-background/20">
          <div className="flex flex-col items-center space-y-4 lg:space-y-0 lg:flex-row lg:justify-between">
            <div className="text-sm text-background/60 text-center lg:text-left">
              © 2025 BookHub. All rights reserved.
            </div>
            
            <div className="flex flex-col lg:flex-row items-center space-y-3 lg:space-y-0 lg:space-x-6 text-sm text-background/60">
              <span className="text-center">Made with ❤️ for book lovers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;