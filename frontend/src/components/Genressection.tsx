import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Genre } from "@/types/types";

interface GenresSectionProps {
  genres: Genre[];
  loading: boolean;
  handleGenreClick: (genre: string) => void;
  renderLoadingSkeleton: (count: number, type: 'book' | 'genre' | 'magazine') => JSX.Element;
}

export const GenresSection = ({ 
  genres, 
  loading, 
  handleGenreClick, 
  renderLoadingSkeleton 
}: GenresSectionProps) => {
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