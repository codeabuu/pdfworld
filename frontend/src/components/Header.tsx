import { useState, useEffect, useRef } from "react";

import ProfileDropdown from "@/components/profiledropdown";
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
  Library,
  Star,
  Sparkles,
  Crown,
  Zap,
  DollarSign,
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


const mobileAccountDropdownRef = useRef<HTMLDivElement>(null);

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
        !accountDropdownRef.current.contains(target) &&
        !isMenuOpen
      ) {
        setIsAccountDropdownOpen(false);
      }

      if (
      mobileAccountDropdownRef.current &&
      !mobileAccountDropdownRef.current.contains(target) &&
      isMenuOpen // Only handle mobile dropdown when mobile menu is open
    ) {
      setIsAccountDropdownOpen(false);
    }

      // Close Mobile Menu
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        isMenuOpen
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, [isMenuOpen]);

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
        return <Badge className="bg-emerald-500 text-white border-0 text-xs px-2 py-1">Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-500 text-white border-0 text-xs px-2 py-1">Free Trial</Badge>;
      case "past_due":
        return <Badge className="bg-amber-500 text-white border-0 text-xs px-2 py-1">Past Due</Badge>;
      case "canceled":
        return <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">Canceled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">Inactive</Badge>;
    }
  };

  const getPlanIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Crown className="h-4 w-4 text-amber-500" />;
      case "trialing":
        return <Zap className="h-4 w-4 text-blue-500" />;
      default:
        return <Star className="h-4 w-4 text-gray-400" />;
    }
  };

  const navItems = [
    { name: "Home", href: "/", icon: "🏠" },
    { name: "New Releases", href: "/releases", icon: <Sparkles className="h-4 w-4" /> },
    { name: "Genres", href: "/genres", icon: "📚" },
    { name: "Magazines & News Papers", href: "/magazines", icon: "📰" },
    { name: "Pricing", href: "/pricing", icon: <DollarSign className="h-4 w-4" /> },
  ];

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Side Menu Overlay - Higher z-index */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Side Menu - Higher z-index */}
      <div
        ref={menuRef}
        className={cn(
          "fixed top-0 right-0 w-80 bg-white border-l border-gray-200 z-[101] transform transition-transform duration-300 ease-in-out md:hidden max-h-screen overflow-y-auto shadow-xl",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Menu Header - Clean and Modern */}
        <div className="bg-slate-900 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6" />
              <h2 className="text-lg font-semibold">BookHub</h2>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* User Welcome Section */}
          {isAuthenticated && user && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.name || "Welcome back!"}
                  </p>
                  <p className="text-xs text-white/70 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-2"
                title="Log out"
              >
                <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-100" />
              </button>
            </div>
          )}
        </div>

        {/* Menu Content */}
        <div className="p-4">
          {/* Navigation Links with Icons */}
          <nav className="space-y-2 mb-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 py-3 px-4 rounded-lg transition-all duration-200 font-medium group",
                  isActive(item.href)
                    ? "bg-slate-100 text-slate-900 border border-slate-200"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                {isActive(item.href) && (
                  <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                )}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="space-y-4">
            {isLoading ? (
              // Show loading state only for auth section
              <div className="space-y-3">
                <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
                <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
              </div>
            ) : isAuthenticated ? (
              <>
                {/* Subscription Status Card */}
                {subscription && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getPlanIcon(subscription.status)}
                        <span className="text-sm font-medium text-slate-700">Plan</span>
                      </div>
                      {getPlanBadge(subscription.status)}
                    </div>
                    {subscription?.status === "trialing" && subscription.trial_end && (
                      <p className="text-xs text-slate-600">
                        Trial ends: {new Date(subscription.trial_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Go to Library Button */}
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg shadow-sm hover:shadow transition-all duration-200">
                    <Library className="h-5 w-5 mr-2" />
                    Go to Library
                  </Button>
                </Link>

                {/* Account Dropdown */}
                <div className="relative" ref={accountDropdownRef}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-slate-700 hover:bg-slate-50 hover:text-slate-900 py-3 rounded-lg border border-slate-200"
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      <span className="text-base font-medium">Account Settings</span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${
                        isAccountDropdownOpen ? "rotate-180" : ""
                      }`} 
                    />
                  </Button>

                  {/* Account Dropdown Menu */}
                  {isAccountDropdownOpen && (
                    <div className="mt-2 bg-white rounded-lg border border-slate-200 shadow-lg py-2 space-y-1 z-50">
                      {/* Subscription Management */}
                      <button
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                        onClick={() => {
                          setIsSubscriptionModalOpen(true);
                          setIsAccountDropdownOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        <CreditCard className="h-4 w-4 text-slate-500" />
                        <span>Manage Subscription</span>
                      </button>

                      {/* Profile Settings */}
                      <button
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                        onClick={() => {
                          setIsProfileModalOpen(true);
                          setIsAccountDropdownOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        <User className="h-4 w-4 text-slate-500" />
                        <span>Profile & Settings</span>
                      </button>

                      {/* Help & FAQ */}
                      <button
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                        onClick={() => {
                          window.open("/help-faq", "_blank", "noopener,noreferrer");
                          setIsAccountDropdownOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        <HelpCircle className="h-4 w-4 text-slate-500" />
                        <span>Help & FAQ</span>
                      </button>

                      {/* Divider */}
                      <div className="border-t border-slate-200 my-1"></div>

                      {/* Logout */}
                      <button
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Guest User CTA */}
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-600 mb-3">Join our reading community</p>
                </div>
                
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center py-3 rounded-lg border-slate-300 hover:border-slate-400 text-slate-700 transition-colors">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg shadow-sm hover:shadow transition-all duration-200">
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Header - Modern Design - ALWAYS SHOW IMMEDIATELY */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container-custom">
          {/* Top Row - Logo, Nav, Auth */}
          <div className="flex items-center justify-between h-16">
            {/* Logo - Clean and Modern */}
            <Link to="/" 
              onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
              className="flex items-center space-x-2 group"
            >
              <div className="relative">
                <BookOpen className="h-8 w-8 text-slate-900 group-hover:text-slate-700 transition-colors" />
              </div>
              <span className="text-2xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                BookHub
              </span>
            </Link>

            {/* Desktop Navigation - Clean */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg transition-all duration-200 font-medium relative group",
                    isActive(item.href)
                      ? "text-slate-900 font-semibold bg-slate-300"
                      : "text-slate-800 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {item.name}
                  {isActive(item.href) && (
                    <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-slate-900 rounded-full"></span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons - Modern with loading state */}
           {/* Auth Buttons - Modern with loading state */}
<div className="hidden md:flex items-center space-x-3">
  {isLoading ? (
    // Show loading state only for auth buttons
    <div className="flex items-center space-x-3">
      <div className="animate-pulse bg-gray-200 h-9 w-16 rounded-lg"></div>
      <div className="animate-pulse bg-gray-200 h-9 w-32 rounded-lg"></div>
    </div>
  ) : isAuthenticated ? (
    <div className="flex items-center space-x-3">
      <Link to="/dashboard">
        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-6 rounded-lg shadow-sm hover:shadow transition-all duration-200">
          <Library className="h-4 w-4 mr-2" />
          Go to Library
        </Button>
      </Link>
      {/* Profile Dropdown */}
      <div className="relative" ref={accountDropdownRef}>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
        >
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-amber-600" />
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${
            isAccountDropdownOpen ? "rotate-180" : ""
          }`} />
        </Button>

        {/* Profile Dropdown Menu */}
        {isAccountDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-amber-600" />
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
              </div>
            </div>

            {/* Subscription Section */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Subscription</span>
                {subscription && getPlanBadge(subscription.status)}
              </div>

              {subscription?.status === "trialing" && subscription.trial_end && (
                <p className="text-xs text-muted-foreground">
                  Trial ends: {new Date(subscription.trial_end).toLocaleDateString()}
                </p>
              )}

              <button
                className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md transition-colors"
                onClick={() => {
                  setIsSubscriptionModalOpen(true);
                  setIsAccountDropdownOpen(false);
                }}
              >
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Manage Subscription
              </button>
            </div>

            {/* Settings Links */}
            <div className="px-4 py-2 border-b border-gray-100">
              <button
                className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md transition-colors"
                onClick={() => {
                  setIsProfileModalOpen(true);
                  setIsAccountDropdownOpen(false);
                }}
              >
                <User className="h-4 w-4 text-muted-foreground" />
                Profile & Settings
              </button>

              <button
                className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md transition-colors"
                onClick={() => {
                  window.open("/help-faq", "_blank", "noopener,noreferrer");
                  setIsAccountDropdownOpen(false);
                }}
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                Help & FAQ
              </button>
            </div>

            {/* Logout */}
            <div className="px-4 py-2">
              <button
                className="w-full flex items-center gap-3 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
    <>
      <Link to="/login">
        <Button variant="outline" className="text-slate-800 hover:text-slate-900 border-slate-700 hover:border-slate-600 transition-colors">
          Login
        </Button>
      </Link>
      <Link to="/signup">
        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-6 rounded-lg shadow-sm hover:shadow transition-all duration-200">
          Start Free Trial
        </Button>
      </Link>
    </>
  )}
</div>

            {/* Mobile Menu Button - Clean */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop Search Bar - Modern */}
          <div className="hidden md:flex justify-center py-3 border-t border-gray-200">
            <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books, authors, genres..."
                className="pl-10 w-full bg-white border-slate-300 focus:border-slate-400 focus:ring-slate-400 rounded-lg"
                disabled={isSearching}
              />
              {searchQuery.trim() && (
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 h-7 bg-slate-900 hover:bg-slate-800 text-white border-0 rounded-md"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                  ) : null}
                  Search
                </Button>
              )}
            </form>
          </div>

          {/* Mobile Search - Modern */}
          <div className="md:hidden py-4 border-t border-gray-200">
            <form onSubmit={handleSearch} className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books, authors, genres..."
                  className="pl-10 pr-4 w-full bg-white border-slate-300 rounded-lg"
                  disabled={isSearching}
                />
              </div>
              {searchQuery.trim() && (
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white border-0 rounded-lg whitespace-nowrap"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                  ) : null}
                  Search
                </Button>
              )}
            </form>
          </div>
        </div>
      </header>

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
    </>
  );
};

export default Header;