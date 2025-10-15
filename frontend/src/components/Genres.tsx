// Genres.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getGenres, getGenreBooks, getPopularGenres } from "@/lib/api"; // Add getPopularGenres import
import GenreBooks from "./GenreBooks";
import GenresList from "./GenresList";
import { Genre, GenreBook } from "@/types/types";
import { Loader } from "lucide-react";

const Genres = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [popularGenres, setPopularGenres] = useState<Genre[]>([]); // Add state for popular genres
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [genreBooks, setGenreBooks] = useState<GenreBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const getUrlParams = () => {
    const searchParams = new URLSearchParams(location.search);
    const genreSlug = searchParams.get('genre');
    const page = parseInt(searchParams.get('page') || '1');
    return { genreSlug, page };
  };

  // Fetch all genres and popular genres on component mount
  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch both regular genres and popular genres
        const [regularGenresResponse, popularGenresResponse] = await Promise.allSettled([
          getGenres(),
          getPopularGenres()
        ]);

        let allGenres: Genre[] = [];
        let popularGenresData: Genre[] = [];

        // Process regular genres
        if (regularGenresResponse.status === 'fulfilled') {
          allGenres = regularGenresResponse.value.results;
        }

        // Process popular genres
        if (popularGenresResponse.status === 'fulfilled') {
          // Map the API response to match your Genre type
            popularGenresData = popularGenresResponse.value.results.map(apiGenre => ({
            id: apiGenre.slug, // Use slug as ID
            name: apiGenre.name,
            slug: apiGenre.slug,
            book_count: apiGenre.book_count,
            // Add any other required properties from your Genre type
          }));
        }

        setGenres(allGenres);
        setPopularGenres(popularGenresData);

        const { genreSlug, page } = getUrlParams();
        if (genreSlug) {
          // Check both regular and popular genres
          const genre = [...allGenres, ...popularGenresData].find(g => g.slug === genreSlug);
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

  // Watch for URL changes
  useEffect(() => {
    const { genreSlug, page } = getUrlParams();
    
    if (genreSlug) {
      // Check both regular and popular genres
      const genre = [...genres, ...popularGenres].find(g => g.slug === genreSlug);
      if (genre) {
        if (selectedGenre?.slug === genreSlug) {
          loadGenreBooks(genre, page);
        } else {
          setSelectedGenre(genre);
          loadGenreBooks(genre, page);
        }
      } else {
        setSelectedGenre(null);
        setGenreBooks([]);
      }
    } else {
      setSelectedGenre(null);
      setGenreBooks([]);
      setCurrentPage(1);
    }
  }, [location.search, genres, popularGenres]); 

  const loadGenreBooks = async (genre: Genre, page: number = 1) => {
    if (selectedGenre?.slug === genre.slug && currentPage === page && genreBooks.length > 0) {
      return;
    }
    
    setBooksLoading(true);
    setError(null);
    setIsTransitioning(true);
    
    try {
      const response = await getGenreBooks(genre.slug, page);
      setGenreBooks(response.results);
      setCurrentPage(page);
      setTotalPages(response.total_pages || 1);
      setIsTransitioning(false);
    } catch (err) {
      setError(`Failed to load books for ${genre.name}`);
      console.error("Genre books fetch error:", err);
      setIsTransitioning(false);
    } finally {
      setBooksLoading(false);
    }
  };

  const handleGenreSelect = (genre: Genre) => {
    navigate(`/dashboard/genres?genre=${genre.slug}&page=1`);
  };

  const handlePageChange = async (page: number) => {
    if (selectedGenre && page >= 1) {
      navigate(`/dashboard/genres?genre=${selectedGenre.slug}&page=${page}`, { replace: false });
    }
  };

  const handleBookSelect = (book: GenreBook) => {
    const slug = book.link.split('/').filter(Boolean).pop();
    if (slug) {
      navigate(`/book/${slug}`, {
        state: {
          fromGenres: true,
          bookData: book,
          genre: selectedGenre?.name,
          returnUrl: `/genres?genre=${selectedGenre?.slug}&page=${currentPage}`
        }
      });
    }
  };

  const handleBackToGenres = () => {
    navigate('/genres');
  };

  const handleNavigateBack = () => {
    navigate(-1);
  };

  return (
    <section className="pt-4 pb-8 bg-background">
      <div className="container-custom">
        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading Overlay */}
        {isTransitioning && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Render appropriate component */}
        {selectedGenre ? (
          <GenreBooks
            genre={selectedGenre}
            books={genreBooks}
            currentPage={currentPage}
            totalPages={totalPages}
            loading={booksLoading}
            onPageChange={handlePageChange}
            onBookSelect={handleBookSelect}
            onBackToGenres={handleBackToGenres}
          />
        ) : (
          <GenresList
            genres={genres}
            popularGenres={popularGenres} // Pass popular genres
            loading={loading}
            onGenreSelect={handleGenreSelect}
            onNavigateBack={handleNavigateBack}
          />
        )}
      </div>
    </section>
  );
};

export default Genres;