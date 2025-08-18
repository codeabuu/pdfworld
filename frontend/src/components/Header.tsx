import { useState } from "react";
import { Search, Menu, X, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from 'react-router-dom';

interface HeaderProps {
  onSearch: (results: any[]) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/search/?s=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      onSearch(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      onSearch([]);
    } finally {
      setIsSearching(false);
    }
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Browse", href: "#browse" },
    { name: "Genres", href: "#genres" },
    { name: "Web Novels", href: "#novels" },
    { name: "Magazines & News Papers", href: "/magazines" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container-custom">
        {/* Top Row - Logo, Nav, Auth */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" 
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                window.location.reload();
              }
            }}
            className="flex items-center space-x-2"
          >
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">BookHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Login
            </Button>
            <Button className="btn-hero">
              Start Free Trial
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Desktop Search Bar - Now below the main nav */}
        <div className="hidden md:flex justify-center py-3 border-t border-border">
          <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors, genres..."
              className="pl-10 w-full bg-secondary/50 border-border focus:border-primary"
              disabled={isSearching}
            />
          </form>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden py-4 border-t border-border">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors, genres..."
              className="pl-10 bg-secondary/50 border-border"
              disabled={isSearching}
            />
          </form>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
                <Button className="btn-hero w-full">
                  Start Free Trial
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;