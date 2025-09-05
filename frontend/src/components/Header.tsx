import { useState, useEffect } from "react";
import { Search, Menu, X, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onSearch: (results: any[]) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

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
    { name: "New Releases", href: "/releases" },
    { name: "Genres", href: "/genres" },
    { name: "Magazines & News Papers", href: "/magazines" },
    { name: "Pricing", href: "/pricing" },
  ];

  // Show loading state while checking auth status
  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">BookHub</span>
            </div>
            <div className="animate-pulse bg-muted h-8 w-24 rounded-md"></div>
          </div>
        </div>
      </header>
    );
  }

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
              <Link
                key={item.name}
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons - Conditionally rendered */}
          <div className="hidden md:flex items-center space-x-4 ">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mr-10">
                  <User className="h-4 w-4 mr-2" />
                  Go to Library
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="btn-hero">
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )}
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
                <Link
                  key={item.name}
                  to={item.href}
                  className="block text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-4 space-y-2">
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                      <User className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                      <Button className="btn-hero w-full">
                        Start Free Trial
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;