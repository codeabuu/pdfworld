import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import BookDiscovery from "@/components/BookDiscovery";
import RequestBook from "@/components/RequestBook";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { getHighQualityImage } from "@/lib/utils";

const API_BASE_URL = "http://127.0.0.1:8000/";

interface Book {
  title: string;
  author: string;
  link: string;
  image: string;
}

const Index = () => {
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.searchResults) {
      setSearchResults(location.state.searchResults);
      setHasSearched(true);
      return;
    }

    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('q');
    
    if (searchQuery) {
      fetchSearchResults(searchQuery);
    } else if (hasSearched) {
      setHasSearched(false);
      setSearchResults([]);
    }
  }, [location.search, location.state]);
   
  const fetchSearchResults = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/?s=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
      setHasSearched(true);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchResults = (results: Book[]) => {
    setSearchResults(results);
    setHasSearched(true);
  };

  const handleBookClick = (book: Book) => {
    const slug = book.link.split('/').filter(Boolean).pop();
    if (slug) {
      navigate(`/book/${slug}`, {
        state: {
          fromSearch: true,
          searchQuery: new URLSearchParams(location.search).get('q') || '',
          searchResults: searchResults
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearchResults} />
      
      <main>
        {/* Search Results Section */}
        {hasSearched ? (
          <div className="container-custom py-6 sm:py-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
              Search Results ({searchResults.length})
            </h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardHeader className="p-0">
                      <div className="relative aspect-[2/3] bg-gray-200 rounded-t-lg"></div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                    <CardFooter className="p-3 sm:p-4 pt-0">
                      <div className="w-full h-8 sm:h-9 bg-gray-200 rounded"></div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {searchResults.map((book, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow h-full cursor-pointer group"
                    onClick={() => handleBookClick(book)}>
                    <CardHeader className="p-0">
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img
                          src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                          alt={`${book.title} by ${book.author}`}
                          className="object-cover rounded-t-lg w-full h-full group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x225?text=No+Cover';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-medium text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors duration-300">
                        {book.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                        by {book.author}
                      </p>
                    </CardContent>
                    <CardFooter className="p-3 sm:p-4 pt-0">
                      <Button className="w-full text-xs sm:text-sm h-8 sm:h-9 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        onClick={(e) => { e.stopPropagation(); handleBookClick(book); }}>
                        <div className="flex items-center justify-center">
                          <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span>View Details</span>
                        </div>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Search className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-muted-foreground" />
                <p className="text-lg sm:text-xl font-medium">No books found</p>
                <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                  Try different search terms or browse our collection
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 sm:mt-6"
                  onClick={() => setHasSearched(false)}
                >
                  Browse Collection
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Hero />
            <BookDiscovery />
            <RequestBook />
            <Pricing />
            <Testimonials />
            <FAQ />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;