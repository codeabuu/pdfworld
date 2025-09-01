import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Genre } from "@/types/types";
import { useState, useEffect } from "react";
import { getPopularGenres } from "@/lib/api";

interface GenresSectionProps {
  renderLoadingSkeleton: (count: number, type: 'book' | 'genre' | 'magazine') => JSX.Element;
}

export const GenresSection = ({ 
  renderLoadingSkeleton 
}: GenresSectionProps) => {
  const [popularGenres, setPopularGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopularGenres = async () => {
      try {
        setLoading(true);
        const response = await getPopularGenres();
        
        // Map the API response to match your Genre type
        const mappedGenres: Genre[] = response.results.map(apiGenre => ({
          // id: apiGenre.slug,
          name: apiGenre.name,
          slug: apiGenre.slug,
          url: apiGenre.url,
          book_count: apiGenre.book_count,
        }));
        
        setPopularGenres(mappedGenres.slice(0, 10)); // Take top 10 popular genres
      } catch (err) {
        setError("Failed to load popular genres");
        console.error("Failed to fetch popular genres:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularGenres();
  }, []);

  const handleGenreClick = (genre: Genre) => {
    // Navigate to the genre page with the genre slug
    navigate(`/dashboard/genres?genre=${genre.slug}&page=1`);
  };

  if (error) {
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
        <div className="text-center py-4 text-destructive">
          {error}
        </div>
      </section>
    );
  }

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
          {popularGenres.map((genre) => (
            <Button
              key={genre.id}
              variant="outline"
              className="h-12 justify-start px-3 py-2 text-left hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-all duration-200 border text-xs"
              onClick={() => handleGenreClick(genre)}
            >
              <div className="flex-1">
                <div className="font-medium truncate">{genre.name}</div>
                <div className="text-xs text-muted-foreground">
                  {genre.book_count} books
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </section>
  );
};