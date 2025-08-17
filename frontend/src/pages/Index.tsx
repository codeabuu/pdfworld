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
      // If there's a search query in URL, fetch results
      fetchSearchResults(searchQuery);
    } else if (hasSearched) {
      // If no query but hasSearched is true, reset
      setHasSearched(false);
      setSearchResults([]);
    }
  }, [location.search, location.state]);
   
  const fetchSearchResults = async (query: string) => {
    try {
      const response = await fetch(`/api/search/?s=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
      setHasSearched(true);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
      setHasSearched(true);
    }
  };

  const handleSearchResults = (results: Book[]) => {
    setSearchResults(results);
    setHasSearched(true);
    
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearchResults} />
      
      <main>
        {/* Search Results Section - appears below header */}
        {hasSearched ? (
          <div className="container-custom py-8">
            <h2 className="text-2xl font-bold mb-6">
              Search Results ({searchResults.length})
            </h2>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((book, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow h-full">
                    <CardHeader className="p-0">
                      <div className="relative aspect-[2/3]">
                        <img
                          src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                          alt={`${book.title} by ${book.author}`}
                          className="object-cover rounded-t-lg w-full h-full"
                          loading="lazy"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <h3 className="font-medium line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        by {book.author}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button asChild className="w-full cursor-pointer"
                        onClick={() => {
                          const slug = book.link.split('/').filter(Boolean).pop();
                          navigate(`/book/${slug}`, {
                            state: {
                              fromSearch: true,
                              searchQuery: new URLSearchParams(location.search).get('q') || '',
                              searchResults: searchResults // Pass the current results
                            }
                          });
                        }}
                      >
                          <div className="flex items-center justify-center">
                            <BookOpen className="h-4 w-4 mr-2" />
                            <span>View Details</span>
                          </div>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                <p className="text-xl">No books found</p>
                <p className="text-muted-foreground mt-2">
                  Try different search terms
                </p>
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