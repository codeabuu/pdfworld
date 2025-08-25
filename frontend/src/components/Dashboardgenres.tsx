// DashboardGenres.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Grid3X3 } from "lucide-react";
import { getGenres, getGenreBooks } from "@/lib/api";
import { getHighQualityImage } from "@/lib/utils";
import { Genre, Book } from "@/types/types";

const DashboardGenres = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [genreBooks, setGenreBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get URL parameters
  const getUrlParams = () => {
    const searchParams = new URLSearchParams(location.search);
    const genreSlug = searchParams.get('genre');
    const page = parseInt(searchParams.get('page') || '1');
    return { genreSlug, page };
  };

  // Fetch all genres
  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getGenres();
        setGenres(response.results);
        
        const { genreSlug, page } = getUrlParams();
        if (genreSlug) {
          const genre = response.results.find(g => g.slug === genreSlug);
          if (genre) {
            setSelectedGenre(genre);
            loadGenreBooks(genre, page);
          }
        }
      } catch (err) {
        setError("Failed to load genres");
        console.error("Genre fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  // Handle URL changes
  useEffect(() => {
    const { genreSlug, page } = getUrlParams();
    
    if (genreSlug && genres.length > 0) {
      const genre = genres.find(g => g.slug === genreSlug);
      if (genre) {
        if (selectedGenre?.slug !== genreSlug) {
          setSelectedGenre(genre);
        }
        loadGenreBooks(genre, page);
      }
    } else {
      setSelectedGenre(null);
      setGenreBooks([]);
    }
  }, [location.search, genres]);

  const loadGenreBooks = async (genre: Genre, page: number = 1) => {
    setBooksLoading(true);
    setError(null);
    
    try {
      const response = await getGenreBooks(genre.slug, page);
      setGenreBooks(response.results);
      setCurrentPage(page);
      setTotalPages(response.total_pages || 1);
    } catch (err) {
      setError(`Failed to load books for ${genre.name}`);
      console.error("Genre books fetch error:", err);
    } finally {
      setBooksLoading(false);
    }
  };

  const handleGenreSelect = (genre: Genre) => {
    navigate(`/dashboard/genres?genre=${genre.slug}&page=1`);
  };

  const handlePageChange = (page: number) => {
    if (selectedGenre && page >= 1 && page <= totalPages) {
      navigate(`/dashboard/genres?genre=${selectedGenre.slug}&page=${page}`);
    }
  };

  const handleBookClick = (book: Book) => {
    const slug = book.link.split('/').filter(Boolean).pop();
    if (slug) {
      navigate(`/dashboard/book/${slug}`);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="container-custom py-6">
        <Button variant="ghost" onClick={handleBackToDashboard} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="h-12 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-6">
      <Button variant="ghost" onClick={handleBackToDashboard} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {selectedGenre ? (
        // Genre Books View
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              {selectedGenre.name} Books
            </h1>
            <Badge variant="secondary" className="text-sm">
              {genreBooks.length} books
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/genres')}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              All Genres
            </Button>
          </div>

          {booksLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader className="p-0">
                    <div className="aspect-[2/3] bg-gray-200 rounded-t-lg"></div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-8 mt-2 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {genreBooks.map((book, index) => (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Genres List View
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl font-semibold text-foreground">All Genres</h1>
            <Badge variant="secondary" className="text-sm">
              {genres.length} genres
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {genres.map((genre) => (
              <Button
                key={genre.id}
                variant="outline"
                className="h-12 justify-start px-3 py-2 text-left hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-all duration-200 border text-xs"
                onClick={() => handleGenreSelect(genre)}
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
        </div>
      )}
    </div>
  );
};

export default DashboardGenres;