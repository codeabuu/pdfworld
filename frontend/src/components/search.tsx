import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Search } from "lucide-react";
import { searchBooks } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface SearchResult {
  title: string;
  author: string;
  link: string;
  image: string;
}

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const [query, setQuery] = useState(queryParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query) {
      fetchResults(query);
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

  return (
    <div className="container-custom py-8">
      <div className="max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, authors, genres..."
            className="pl-10 w-full bg-background"
          />
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">{error}</div>
      ) : results.length > 0 ? (
        <>
          <h2 className="text-xl font-semibold mb-6">
            Search Results for "{query}"
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((book, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative aspect-[2/3]">
                    <img
                      src={book.image || "/placeholder-book.jpg"}
                      alt={book.title}
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-2">{book.title}</h3>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full">
                    <Link to={book.link} target="_blank">
                      View Details
                    </Link>
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
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
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