
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText as BookOpen, 
  Search, 
  Star, 
  Calendar, 
  Users, 
  Eye,
  ArrowRight,
  TrendingUp,
  Newspaper,
  Sparkles as FireIcon,
  Library,
  FolderOpen as BookText,
  LibraryBigIcon
} from "lucide-react";
import { getNewReleases, getGenres, getMagazines, searchBooks } from "@/lib/api";
import { getHighQualityImage } from "@/lib/utils";

interface Book {
  title: string;
  link: string;
  image: string;
  author: string;
  date?: string;
}

interface Genre {
  id: number;
  name: string;
  count: number;
  color?: string;
}

interface Magazine {
  id: number;
  title: string;
  image: string;
  issue: string;
  date: string;
  category: string;
}

interface SearchResult {
  title: string;
  author: string;
  link: string;
  image: string;
}

// Create section components first
const NewReleasesSection = ({ newReleases, loading, handleBookClick, renderLoadingSkeleton }) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-amber-600" />
          <h2 className="text-2xl font-semibold text-foreground">New Releases</h2>
        </div>
        <Link to="/dashboard/releases">
          <Button variant="outline" className="gap-1 text-sm" size="sm">
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {loading ? (
        renderLoadingSkeleton(4, 'book')
      ) : (
        <>
          {/* 📱 Mobile view (rectangular list) */}
          <div className="space-y-4 sm:hidden">
            {newReleases.map((book, index) => (
              <div
                key={index}
                className="flex items-center gap-4 border border-gray-200 rounded-lg p-3 bg-white hover:bg-amber-50 transition cursor-pointer"
                onClick={() => handleBookClick(book)}
              >
                <img
                  src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                  alt={book.title}
                  className="w-16 h-20 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-amber-700">
                    {book.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    by {book.author || "Unknown Author"}
                  </p>
                </div>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-700 text-xs">
                  <Eye className="h-3 w-3 mr-1" /> View Details
                </Button>
              </div>
            ))}
          </div>
          {/* 💻 Desktop view (cards) */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-5">
            {newReleases.map((book, index) => (
              <Card
                key={index}
                className="group cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
              >
                <CardHeader className="p-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                    <img
                      src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                      alt={book.title}
                      className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">
                      New
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-amber-700 transition-colors text-sm">
                    {book.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    by {book.author || "Unknown Author"}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 rounded-md"
                    onClick={() => handleBookClick(book)}
                  >
                    <Eye className="h-3 w-3" />
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

const GenresSection = ({ genres, loading, handleGenreClick, renderLoadingSkeleton }) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-amber-600" />
          <h2 className="text-2xl font-semibold text-foreground">Popular Genres</h2>
        </div>
        <Link to="/dashboard/genres">
          <Button variant="outline" className="gap-1 text-sm" size="sm">
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {loading ? (
        renderLoadingSkeleton(10, 'genre')
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {genres.map((genre) => (
            <Button
              key={genre.id}
              variant="outline"
              className="h-12 justify-start px-3 py-2 text-left hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-all duration-200 border text-xs"
              onClick={() => handleGenreClick(genre.name)}
            >
              <div className="flex-1">
                <div className="font-medium truncate">{genre.name}</div>
                <div className="text-xs text-muted-foreground">
                  {genre.count} books
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </section>
  );
};

const MagazinesSection = ({ magazines, loading, handleMagazineClick, renderLoadingSkeleton }) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-amber-600" />
          <h2 className="text-2xl font-semibold text-foreground">Latest Magazines</h2>
        </div>
        <Link to="/dashboard/magazines">
          <Button variant="outline" className="gap-1 text-sm" size="sm">
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {loading ? (
        renderLoadingSkeleton(4, 'magazine')
      ) : (
        <>
          <div className="space-y-5 sm:hidden px-3">
            {magazines.map((magazine) => (
              <Card 
                key={magazine.id} 
                className="group cursor-pointer hover:shadow-md transition-shadow border border-gray-200 rounded-xl overflow-hidden"
              >
                <CardHeader className="p-0">
                  <div className="relative w-full h-56 overflow-hidden">
                    <img
                      src={getHighQualityImage(magazine.image) || "/placeholder-magazine.jpg"}
                      alt={magazine.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-md">
                      {magazine.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-amber-700 transition-colors">
                    {magazine.title}
                  </h3>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Issue: {magazine.issue}</p>
                    <p>{new Date(magazine.date).toLocaleDateString()}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <Button 
                    className="w-full gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs h-9 rounded-lg"
                    onClick={() => handleMagazineClick(magazine)}
                  >
                    <Eye className="h-4 w-4" />
                    Read Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* 💻 Desktop view (cards) */}
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {magazines.map((magazine) => (
              <Card key={magazine.id} className="group cursor-pointer hover:shadow-md transition-shadow border border-gray-200">
                <CardHeader className="p-0">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                    <img
                      src={getHighQualityImage(magazine.image) || "/placeholder-magazine.jpg"}
                      alt={magazine.title}
                      className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                      {magazine.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-amber-700 transition-colors text-sm">
                    {magazine.title}
                  </h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Issue: {magazine.issue}</p>
                    <p>Date: {new Date(magazine.date).toLocaleDateString()}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-xs h-8"
                    onClick={() => handleMagazineClick(magazine)}
                  >
                    <Eye className="h-3 w-3" />
                    Read Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

// Main Dashboard Layout Component
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [newReleases, setNewReleases] = useState<Book[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState({
    newReleases: true,
    genres: true,
    magazines: true
  });
  const [searchQuery, setSearchQuery] = useState(queryParams.get("q") || "");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const isSearchMode = queryParams.has("q");

  const isDashboardHome = location.pathname === '/dashboard';
  const isReleasesPage = location.pathname === '/dashboard/releases';
  const isGenresPage = location.pathname === '/dashboard/genres';
  const isMagazinesPage = location.pathname === '/dashboard/magazines';

  useEffect(() => {
    fetchDashboardData();
    
    if (queryParams.has("q")) {
      const query = queryParams.get("q") || "";
      handleSearchResults(query);
    }
  }, []);

  useEffect(() => {
    if (searchQuery && isSearchMode) {
      handleSearchResults(searchQuery);
    }
  }, [searchQuery, isSearchMode]);

  const fetchDashboardData = async () => {
    try {
      const releasesResponse = await getNewReleases();
      setNewReleases(releasesResponse.results.slice(0, 4));
      setLoading(prev => ({ ...prev, newReleases: false }));

      const genresResponse = await getGenres();
      const popularGenres = genresResponse.results
        .sort((a: Genre, b: Genre) => b.count - a.count)
        .slice(0, 10);
      setGenres(popularGenres);
      setLoading(prev => ({ ...prev, genres: false }));

      const magazinesResponse = await getMagazines();
      setMagazines(magazinesResponse.results.slice(0, 4));
      setLoading(prev => ({ ...prev, magazines: false }));

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
    }
  };

  const handleBookClick = (book: Book | SearchResult) => {
    const slug = book.link.split('/').filter(Boolean).pop();
    if (slug) {
      navigate(`/book/${slug}`, {
        state: { bookData: book }
      });
    }
  };

  const handleGenreClick = (genre: string) => {
    navigate(`/genre/${genre.toLowerCase()}`);
  };

  const handleMagazineClick = (magazine: Magazine) => {
    navigate(`/magazine/${magazine.id}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    navigate("/dashboard");
  };

  // Navigation items - updated to use dashboard routes
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LibraryBigIcon },
    { name: "New Releases", path: "/dashboard/releases", icon: FireIcon },
    { name: "Genres", path: "/dashboard/genres", icon: BookText },
    { name: "Magazines & Newspapers", path: "/dashboard/magazines", icon: BookOpen },
  ];

  // Loading skeletons
  const renderLoadingSkeleton = (count: number, type: 'book' | 'genre' | 'magazine') => (
    <div className={`grid gap-4 ${
      type === 'book' || type === 'magazine' ? 
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 
      'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
    }`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="p-0">
            {type !== 'genre' && (
              <div className="aspect-[2/3] bg-gray-200 rounded-t-lg"></div>
            )}
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            {type === 'book' && <div className="h-8 mt-2 bg-gray-200 rounded"></div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Search results display component
  const renderSearchResults = () => {
    if (isSearchLoading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
        </div>
      );
    }

    if (searchError) {
      return (
        <div className="text-center py-12 text-destructive">{searchError}</div>
      );
    }

    if (searchResults.length > 0) {
      return (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Search Results for "{searchQuery}"
            </h2>
            <Button
              variant="outline"
              onClick={handleClearSearch}
              className="text-sm"
            >
              Clear Search
            </Button>
          </div>
          
          {/* Mobile Results */}
          <div className="space-y-3 lg:hidden">
            {searchResults.map((book, index) => (
              <div 
                key={index} 
                className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleBookClick(book)}
              >
                <div className="w-16 h-24 flex-shrink-0">
                  <img
                    src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                    alt={book.title}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                    by {book.author || "Unknown Author"}
                  </p>
                  <Button 
                    className="bg-amber-600 hover:bg-amber-700 text-xs h-7"
                    onClick={(e) => { e.stopPropagation(); handleBookClick(book); }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Results */}
          <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {searchResults.map((book, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                    <img
                      src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                      alt={book.title}
                      className="object-cover w-full"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    by {book.author || "Unknown Author"}
                  </p>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-xs h-7"
                    onClick={() => handleBookClick(book)}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      );
    }

    if (searchQuery) {
      return (
        <div className="text-center py-12">
          <p>No results found for "{searchQuery}"</p>
          <Button
            variant="link"
            onClick={handleClearSearch}
            className="mt-4"
          >
            Clear search
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Elegant Header */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 border-b border-amber-200 py-8 md:py-12">
        <div className="container-custom">
          <div className="text-center space-y-3 md:space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-amber-100 rounded-2xl mb-3 md:mb-4 shadow-sm">
              <Library className="h-7 w-7 md:h-8 md:w-8 text-amber-700" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground font-serif">
              Welcome to Your Digital Library
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover endless stories, explore diverse knowledge, and embark on new reading adventures
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom">
          <div className="flex flex-wrap justify-center gap-4 py-6">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`group flex items-center gap-2 px-6 py-3 rounded-2xl border shadow-sm text-foreground 
                           transition-all duration-300 text-base font-medium
                           ${isActive 
                             ? 'bg-amber-600 text-white border-amber-600' 
                             : 'bg-white border-gray-200 hover:bg-amber-50 hover:border-amber-300 hover:shadow-md'}`}
                >
                  <IconComponent className={`h-5 w-5 group-hover:scale-110 transition-transform duration-200
                                         ${isActive ? 'text-white' : 'text-amber-600'}`} />
                  <span>{item.name}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container-custom py-4">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 relative">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search books, authors, genres, magazines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                            text-base shadow-sm sm:rounded-r-none"
              />
            </div>

            {/* Search Button */}
            <Button
              type="submit"
              disabled={!searchQuery.trim()}
              className="mt-2 sm:mt-0 w-full sm:w-auto 
                         bg-gradient-to-r from-amber-500 to-blue-600 
                         hover:from-amber-600 hover:to-blue-700
                         text-white font-medium px-6 py-2 
                         rounded-full shadow-md transition-all duration-200
                         sm:rounded-l-lg sm:rounded-r-lg"
            >
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Conditionally render search results or dashboard content */}
      {isSearchMode ? (
        <div className="container-custom py-6">
          {renderSearchResults()}
        </div>
      ) : (
        <>
          {/* Show dashboard home content */}
          {isDashboardHome && (
            <main className="container-custom py-6 space-y-10">
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
              <section className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-amber-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="h-6 w-6 text-blue-700" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">10,000+</h3>
                    <p className="text-sm text-muted-foreground">Books Available</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-blue-700" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">5,000+</h3>
                    <p className="text-sm text-muted-foreground">Active Readers</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="h-6 w-6 text-purple-700" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">4.8/5</h3>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                </div>
              </section>
            </main>
          )}

          {/* Render nested routes content */}
          <Outlet />
        </>
      )}
    </div>
  );
};

export default Dashboard;