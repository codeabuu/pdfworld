import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Menu, 
  X, 
  User, 
  BookOpen, 
  LogOut, 
  ChevronDown,
  CreditCard,
  HelpCircle,
  Settings,
  Library
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { authService } from "@/services/Myauthservice";
import { subscriptionService } from "@/services/subservice";
import axios from "axios";
import ProfileSettingsModal from "@/components/ProfileSetModal";
import ManageSubscriptionModal from "@/components/ManageSubscriptionModal";

const API_BASE_URL = "http://127.0.0.1:8000";

interface HeaderProps {
  onSearch: (results: any[]) => void;
}

interface UserData {
  id: string;
  email: string;
  name?: string;
}

interface Subscription {
  has_access: boolean;
  status: string;
  trial_end?: string;
  in_trial?: boolean;
  trial_has_ended?: boolean;
  message?: string;
}

const Header = ({ onSearch }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);


  // Fetch user data when authenticated
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) return;

      try {
        const userId = authService.getUserId();
        if (!userId) return;

        // Fetch user email from /api/me/
        try {
          const response = await axios.get(`${API_BASE_URL}/api/me/`);
          const userData = response.data.user || response.data;
          const userEmail = userData.email || "Unknown";
          const userName = userData.name || "";
          
          setUser({
            id: userId,
            email: userEmail,
            name: userName
          });

          // Fetch subscription status
          const subscriptionData = await subscriptionService.checkSubscriptionStatus(userId);
          setSubscription(subscriptionData);
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          setUser({
            id: userId,
            email: "Unknown",
            name: "Unknown"
          });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };

    fetchUserData();
  }, [isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    // Close Account Dropdown
    if (
      accountDropdownRef.current &&
      !accountDropdownRef.current.contains(target)
    ) {
      setIsAccountDropdownOpen(false);
    }

    // Close Mobile Menu
    if (
      menuRef.current &&
      !menuRef.current.contains(target)
    ) {
      setIsMenuOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


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

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsMenuOpen(false);
      setIsAccountDropdownOpen(false);
      setUser(null);
      setSubscription(null);
      // Refresh the page to update auth state
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getPlanBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 text-xs">Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-600 text-xs">Free Trial</Badge>;
      case "past_due":
        return <Badge className="bg-amber-600 text-xs">Past Due</Badge>;
      case "canceled":
        return <Badge variant="outline" className="text-xs">Canceled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Inactive</Badge>;
    }
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "New Releases", href: "/releases" },
    { name: "Genres", href: "/genres" },
    { name: "Magazines & News Papers", href: "/magazines" },
    { name: "Pricing", href: "/pricing" },
  ];

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

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
                className={cn(
                  "transition-colors duration-200 font-medium relative",
                  isActive(item.href)
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.name}
                {isActive(item.href) && (
                  <span className="absolute -bottom-7 left-0 right-0 h-0.5 bg-primary"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons - Conditionally rendered */}
          <div className="hidden md:flex items-center space-x-4 ">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mr-10">
                  <Library className="h-4 w-4 mr-2" />
                  {/* <BookOpen className="h-4 w-4 mr-2" /> */}
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
            {searchQuery.trim() && (
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 h-7 bg-background hover:bg-accent text-foreground border"
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : null}
                Go
              </Button>
            )}
          </form>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden py-4 border-t border-border">
          <form onSubmit={handleSearch} className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books, authors, genres..."
                className="pl-10 pr-4 w-full bg-secondary/50 border-border"
                disabled={isSearching}
              />
            </div>
            {searchQuery.trim() && (
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="h-10 px-4 bg-background hover:bg-accent text-foreground border whitespace-nowrap"
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1" />
                ) : null}
                Search
              </Button>
            )}
          </form>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
          ref={menuRef} 
            className="md:hidden py-4 border-t border-border"
          >
            <nav className="space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "block transition-colors duration-200 font-medium",
                    isActive(item.href)
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-4 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                        <Library className="h-4 w-4 mr-2" />
                        Go to Library
                      </Button>
                    </Link>

                    {/* User Profile Section - Like Dashboard
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg mb-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user?.email || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {subscription ? (
                            <span className="flex items-center gap-1">
                              {getPlanBadge(subscription.status)}
                              {subscription.status === "trialing" && "Trial"}
                            </span>
                          ) : (
                            "Free Plan"
                          )}
                        </p>
                      </div>
                    </div> */}

                    {/* Account Dropdown */}
                    <div className="relative" ref={accountDropdownRef}>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-muted-foreground hover:text-foreground"
                        onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                      >
                        <div className="flex items-center gap-3">
                          <Settings className="h-4 w-4 " />
                          <span className="text-base font-medium">Account</span>
                        </div>
                        <ChevronDown 
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            isAccountDropdownOpen ? "rotate-180" : ""
                          }`} 
                        />
                      </Button>

                      {/* Account Dropdown Menu */}
                      {isAccountDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-2 space-y-1 z-50">
                          {/* Subscription Section */}
                          <div className="px-3 py-2 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">Subscription</span>
                              {subscription && getPlanBadge(subscription.status)}
                            </div>
                            
                            {subscription?.status === "trialing" && subscription.trial_end && (
                              <p className="text-xs text-muted-foreground mb-2">
                                Trial ends: {new Date(subscription.trial_end).toLocaleDateString()}
                              </p>
                            )}
                            
                            <button
                              className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md transition-colors"
                              onClick={() => {
                                setIsSubscriptionModalOpen(true);
                                setIsAccountDropdownOpen(false);
                                setIsMenuOpen(false);
                              }}
                            >
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              Manage Subscription
                            </button>
                          </div>

                          {/* Settings Links */}
                          <button
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md transition-colors"
                            onClick={() => {
                              setIsProfileModalOpen(true);
                              setIsAccountDropdownOpen(false);
                              setIsMenuOpen(false);
                            }}
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            Profile & Settings
                          </button>

                          <button
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md transition-colors"
                            onClick={() => {
                              window.open("/help-faq", "_blank", "noopener,noreferrer");
                              setIsAccountDropdownOpen(false);
                              setIsMenuOpen(false);
                            }}
                          >
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            Help & FAQ
                          </button>

                          {/* Divider */}
                          <div className="border-t border-gray-100 my-1"></div>

                          {/* Logout */}
                          <button
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </button>
                        </div>
                      )}
                    </div>
                  </>
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

      {/* Modals */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        subscription={subscription}
      />
      <ManageSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        subscription={subscription}
        user={user}
      />
    </header>
  );
};

export default Header;