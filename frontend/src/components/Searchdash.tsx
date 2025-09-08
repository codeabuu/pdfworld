import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import { searchBooks } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { getHighQualityImage } from "@/lib/utils";

interface SearchResult {
  title: string;
  author: string;
  link: string;
  image: string;
}

interface SearchDashProps {
  onClearSearch: () => void;
  showSearchHeader?: boolean;
  searchQuery?: string;
}

export default function SearchDash({ 
  onClearSearch, 
  showSearchHeader = true, 
  searchQuery = "" 
}: SearchDashProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  // Use the searchQuery prop if provided, otherwise get from URL
  const [query, setQuery] = useState(searchQuery || queryParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Update internal query when prop changes
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== query) {
      setQuery(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (query) {
      fetchResults(query);
    } else {
      setResults([]);
      setError("");
    }
  }, [query]);

  const fetchResults = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      setError("");
      const data = await searchBooks(searchQuery);
      setResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Failed to fetch results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleBookClick = (book: SearchResult) => {
    const slug = book.link.split('/').filter(Boolean).pop();
    if (slug) {
      navigate(`/dashboard/book/${slug}`, {
        state: {
          bookData: book,
          fromSearch: true,
          searchQuery: query
        }
      });
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setError("");
    onClearSearch();
  };

  return (
    <div className="py-4 lg:py-6">
      {/* Conditionally render Search Header */}
      {showSearchHeader && (
        <div className="mb-6">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search books, authors, genres..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              />
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">{error}</div>
      ) : results.length > 0 ? (
        <>
          <h2 className="text-xl font-semibold mb-6">
            Search Results for "{query}"
          </h2>
          
          {/* Mobile Results */}
          <div className="space-y-3 lg:hidden">
            {results.map((book, index) => (
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
            {results.map((book, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                    <img
                      src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                      alt={book.title}
                      className="object-cover w-full h-full"
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
      ) : query ? (
        <div className="text-center py-12">
          <p>No results found for "{query}"</p>
          <Button
            variant="link"
            onClick={clearSearch}
            className="mt-4"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4" />
          <p>Search for books, authors, or genres</p>
        </div>
      )}
    </div>
  );
}