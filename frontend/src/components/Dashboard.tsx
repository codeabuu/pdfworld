// Dashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { 
  Search, 
  Star, 
  Users,
  Library,
  Menu,
  X
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
import { renderLoadingSkeleton, navItems, getHighQualityImage } from "@/lib/utils";


interface DashboardProps {
  children?: React.ReactNode;
}

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

  const isSearchMode = queryParams.has("q");
  const isDashboardHome = location.pathname === '/dashboard';

  useEffect(() => {
    fetchDashboardData();
    if (queryParams.has("q")) {
      handleSearchResults(queryParams.get("q") || "");
    }
  }, []);

  useEffect(() => {
    if (searchQuery && isSearchMode) {
      handleSearchResults(searchQuery);
    }
  }, [searchQuery, isSearchMode]);

  const fetchDashboardData = async () => {
    try {
      const [releasesResponse, genresResponse, magazinesResponse] = await Promise.all([
        getNewReleases(),
        getGenres(),
        getMagazines()
      ]);

      setNewReleases(releasesResponse.results.slice(0, 4));
      
      const popularGenres = genresResponse.results
        .sort((a: Genre, b: Genre) => b.count - a.count)
        .slice(0, 10);
      setGenres(popularGenres);
      
      setMagazines(magazinesResponse.results.slice(0, 4));
      
      setLoading({ newReleases: false, genres: false, magazines: false });

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoading({ newReleases: false, genres: false, magazines: false });
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
    navigate(`/magazine/${magazine.id}`);
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

      {/* Mobile Menu Button */}
      <div className="sm:hidden bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container-custom py-3">
          <div className="flex items-center justify-between">
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
              Menu
            </Button>
            
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
            <div className="space-y-2">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.name}
                    onClick={() => handleNavItemClick(item.path)}
                    className={`w-full justify-start gap-3 py-4 text-left 
                             ${isActive 
                               ? 'bg-amber-600 text-white' 
                               : 'bg-white text-foreground hover:bg-amber-50'}`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-base">{item.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation & Search */}
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

      {/* Main Content */}
      <div className={`${isMobileMenuOpen ? 'opacity-50' : ''} transition-opacity duration-200`}>
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
      </div>
    </div>
  );
};

export default Dashboard;