import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Star, 
  Users,
  Library,
  Menu,
  X,
  User,
  Crown,
  LogOut,
  CreditCard,
  ChevronDown,
  Settings,
  HelpCircle,
  Home,
  BookOpen,
  Newspaper
} from "lucide-react";
import { getNewReleases, getGenres, getMagazines, searchBooks } from "@/lib/api";
import { 
  Book, 
  Genre, 
  Magazine, 
  SearchResult, 
  LoadingState 
} from "@/types/types";
import { NewReleasesSection } from "./Newreleasessection";
import { GenresSection} from "./Genressection";
import { MagazinesSection } from "./Magazinesection";
import { SearchResults } from "./Searchresults";
import { renderLoadingSkeleton } from "@/lib/utils";
import { authService } from "@/services/Myauthservice";
import { subscriptionService } from "@/services/subservice";
import axios from "axios";
import ProfileSettingsModal from "@/components/ProfileSetModal";
import ManageSubscriptionModal from "./ManageSubscriptionModal";

const API_BASE_URL = "http://127.0.0.1:8000";

interface DashboardProps {
  children?: React.ReactNode;
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

// Define navigation items
const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "New Releases", path: "/dashboard/releases", icon: BookOpen },
  { name: "Genres", path: "/dashboard/genres", icon: Library },
  { name: "Magazines", path: "/dashboard/magazines", icon: Newspaper },
];

const Dashboard = ({ children }: DashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [newReleases, setNewReleases] = useState<Book[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    newReleases: true,
    genres: true,
    magazines: true
  });
  const [searchQuery, setSearchQuery] = useState(queryParams.get("q") || "");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const isSearchMode = queryParams.has("q");
  const isDashboardHome = location.pathname === '/dashboard';
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchUserData();
    if (queryParams.has("q")) {
      handleSearchResults(queryParams.get("q") || "");
    }
  }, []);

  useEffect(() => {
    if (searchQuery && isSearchMode) {
      handleSearchResults(searchQuery);
    }
  }, [searchQuery, isSearchMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [releasesResponse, genresResponse, magazinesResponse] = await Promise.all([
        getNewReleases(),
        getGenres(),
        getMagazines()
      ]);

      setNewReleases(releasesResponse.results.slice(0, 4));
      
      const popularGenres = genresResponse.results
        .sort((a: Genre, b: Genre) => b.book_count - a.book_count)
        .slice(0, 10);
      setGenres(popularGenres);
      
      setMagazines(magazinesResponse.results.slice(0, 4));
      
      setLoading({ newReleases: false, genres: false, magazines: false });

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoading({ newReleases: false, genres: false, magazines: false });
    }
  };

  const fetchUserData = async () => {
    try {
      const isAuth = await authService.checkAuth();
      if (!isAuth) return;

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

  const handleSearchResults = async (searchQuery: string) => {
    try {
      setIsSearchLoading(true);
      setSearchError("");
      const data = await searchBooks(searchQuery);
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchError("Failed to fetch results. Please try again.");
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleBookClick = (book: Book | SearchResult) => {
    const slug = book.link.split('/').filter(Boolean).pop();
    if (slug) {
      navigate(`/dashboard/book/${slug}`, { state: { bookData: book, fromDashboard: true } });
      setIsMobileMenuOpen(false);
    }
  };

  const handleGenreClick = (genre: string) => {
    navigate(`/genres/${genre.toLowerCase()}`);
    setIsMobileMenuOpen(false);
  };

  const handleMagazineClick = (magazine: Magazine) => {
    navigate(`/dashboard/magazines`);
    setIsMobileMenuOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    navigate("/dashboard");
    setIsMobileMenuOpen(false);
  };

  const handleNavItemClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
      setIsProfileDropdownOpen(false);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Elegant Header */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 border-b border-amber-200 py-6 md:py-12">
        <div className="container-custom">
          <div className="text-center space-y-3 md:space-y-4">
            <div className="inline-flex items-center justify-center w-10 h-10 md:w-14 md:h-14 bg-amber-100 rounded-2xl mb-2 md:mb-4 shadow-sm">
              <Library className="h-5 w-5 md:h-8 md:w-8 text-amber-700" />
            </div>
            <h1 className="text-xl md:text-4xl font-bold text-foreground font-serif">
              Welcome to Your Digital Library
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Discover endless stories, explore diverse knowledge, and embark on new reading adventures
            </p>
          </div>
        </div>
      </div>

      {/* Profile Dropdown - Made Sticky */}
      <div className="hidden sm:block fixed top-4 right-4 z-50" ref={profileDropdownRef}>
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50 bg-white shadow-md border border-gray-200"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-amber-600" />
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>

          {isProfileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {/* User Info Section */}
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
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => {
                    setIsSubscriptionModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <CreditCard className="h-3 w-3 mr-2" />
                  Manage Subscription
                </Button>
              </div>

              {/* Settings Links */}
              <div className="px-4 py-2 border-b border-gray-100">
                <button
                  className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md"
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Profile & Settings
                </button>
                
                <button className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  Help & FAQ
                </button>
              </div>

              {/* Logout Section */}
              <div className="px-4 py-2">
                <button
                  className="w-full flex items-center gap-3 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
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

      {/* Mobile Menu Button */}
      <div className="sm:hidden bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container-custom py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center gap-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
                {isMobileMenuOpen ? "Close" : "Menu"}
              </Button>
              
              {/* Library Logo/Brand */}
              <div className="flex items-center gap-2">
                <Library className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-foreground">Library</span>
              </div>
            </div>
            
            {/* Mobile Search Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const searchElement = document.getElementById('mobile-search');
                searchElement?.classList.toggle('hidden');
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div id="mobile-search" className="sm:hidden hidden bg-white border-b border-gray-100">
        <div className="container-custom py-3">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search books, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                          text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={!searchQuery.trim()}
              className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white text-sm py-2"
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-40 bg-white pt-20">
          <div className="container-custom">
            <div className="space-y-4">
              {/* User Profile Section */}
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
                        {subscription.status === "trialing" ? "Free Trial" : subscription.status}
                      </span>
                    ) : (
                      "Free Plan"
                    )}
                  </p>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4">
                  Navigation
                </h3>
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Button
                      key={item.name}
                      onClick={() => handleNavItemClick(item.path)}
                      className={`w-full justify-start gap-3 py-4 text-left rounded-xl
                               ${isActive 
                                 ? 'bg-amber-600 text-white' 
                                 : 'bg-white text-foreground hover:bg-amber-50'}`}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="text-base font-medium">{item.name}</span>
                    </Button>
                  );
                })}
              </div>

              {/* Account Section */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4">
                  Account
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/subscription");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start gap-3 py-4 text-left rounded-xl hover:bg-amber-50"
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-base font-medium">Subscription</span>
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/profile");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start gap-3 py-4 text-left rounded-xl hover:bg-amber-50"
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-base font-medium">Settings</span>
                </Button>
              </div>

              {/* Help Section */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4">
                  Help
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => {
                    // Add help navigation logic
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start gap-3 py-4 text-left rounded-xl hover:bg-amber-50"
                >
                  <HelpCircle className="h-5 w-5" />
                  <span className="text-base font-medium">Help & Support</span>
                </Button>
              </div>

              {/* Logout Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-3 py-4 text-left rounded-xl text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-base font-medium">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation & Search - Made Sticky */}
      <div className="hidden sm:block sticky top-0 z-40 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="container-custom">
          {/* Quick Navigation */}
          <div className="flex flex-wrap justify-center gap-2 py-4">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm 
                           transition-all duration-300 text-sm font-medium
                           ${isActive 
                             ? 'bg-amber-600 text-white border-amber-600' 
                             : 'bg-white text-foreground border-gray-200 hover:bg-amber-50 hover:text-foreground hover:border-amber-300 hover:shadow-md'}`}
                >
                  <IconComponent className={`h-4 w-4 group-hover:scale-110 transition-transform duration-200
                                         ${isActive ? 'text-white' : 'text-amber-600'}`} />
                  <span className="inline">{item.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="py-3">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 relative">
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search books, authors, genres, magazines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                              text-sm shadow-sm"
                  />
                </div>

                {/* Search Button */}
                <Button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="mt-2 sm:mt-0 w-full sm:w-auto 
                             bg-gradient-to-r from-amber-500 to-amber-600 
                             hover:from-amber-600 hover:to-amber-700
                             text-white font-medium px-4 py-2 
                             rounded-lg transition-all duration-200 text-sm"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Profile Button - Made Sticky */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <Button
          variant="outline"
          className="w-full justify-between bg-white shadow-md"
          onClick={() => navigate("/profile")}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-sm font-medium">
              {user?.email?.split('@')[0] || "Profile"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className={`${isMobileMenuOpen ? 'opacity-50' : ''} transition-opacity duration-200 pb-16 sm:pb-0`}>
        {/* Conditionally render search results or dashboard content */}
        {isSearchMode ? (
          <div className="container-custom py-4 md:py-6">
            <SearchResults
              searchResults={searchResults}
              isSearchLoading={isSearchLoading}
              searchError={searchError}
              searchQuery={searchQuery}
              handleBookClick={handleBookClick}
              handleClearSearch={handleClearSearch}
            />
          </div>
        ) : (
          <>
            {isDashboardHome && (
              <main className="container-custom py-4 md:py-6 space-y-8 md:space-y-10">
                <NewReleasesSection 
                  newReleases={newReleases} 
                  loading={loading.newReleases} 
                  handleBookClick={handleBookClick}
                  renderLoadingSkeleton={renderLoadingSkeleton}
                />
                <GenresSection 
                  genres={genres} 
                  loading={loading.genres} 
                  handleGenreClick={handleGenreClick}
                  renderLoadingSkeleton={renderLoadingSkeleton}
                />
                <MagazinesSection 
                  magazines={magazines} 
                  loading={loading.magazines} 
                  handleMagazineClick={handleMagazineClick}
                  renderLoadingSkeleton={renderLoadingSkeleton}
                />
                
                {/* Quick Stats */}
                <section className="bg-amber-50 rounded-xl p-4 md:p-6 border border-amber-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="text-center">
                      <div className="bg-amber-100 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                        <Library className="h-4 w-4 md:h-6 md:w-6 text-blue-700" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-foreground">10,000+</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">Books Available</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-blue-100 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                        <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-700" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-foreground">5,000+</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">Active Readers</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-purple-100 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                        <Star className="h-4 w-4 md:h-6 md:w-6 text-purple-700" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-foreground">4.8/5</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">Average Rating</p>
                    </div>
                  </div>
                </section>
              </main>
            )}

            {children || <Outlet />}
          </>
        )}
        {/* Add this at the end of your dashboard component's return statement */}
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
      </div>
    </div>
  );
};

export default Dashboard;