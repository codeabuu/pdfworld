// GenresList.tsx
import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";
import { Genre } from "@/types/types";

interface GenresListProps {
  genres: Genre[];
  loading: boolean;
  onGenreSelect: (genre: Genre) => void;
  onNavigateBack: () => void;
}

const GenresList = ({ genres, loading, onGenreSelect, onNavigateBack }: GenresListProps) => {
  
  const renderGenreSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="bg-card rounded-lg border border-border overflow-hidden group cursor-wait">
          <div className="h-40 bg-muted animate-pulse rounded-t-lg flex items-center justify-center">
            <Library className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <div className="p-4 space-y-3">
            <div className="h-5 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            <div className="h-9 bg-muted rounded mt-3 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-foreground">Browse Genres</h1>
        <Button variant="outline" onClick={onNavigateBack}>
          Back to Discovery
        </Button>
      </div>

      {/* Subtitle */}
      <div className="text-center">
        <p className="text-muted-foreground text-lg">
          Discover books from {genres.length} different genres
        </p>
      </div>

      {/* Genres Grid */}
      {loading ? (
        renderGenreSkeletons()
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {genres.map((genre) => (
            <div
              key={genre.slug}
              className="bg-card rounded-lg border border-border overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => onGenreSelect(genre)}
            >
              {/* Genre Card */}
              <div className="h-40 relative bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
                <Library className="h-12 w-12 text-primary" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
              </div>

              {/* Genre Info */}
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {genre.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {genre.book_count.toLocaleString()} books
                </p>

                <Button
                  variant="secondary"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenreSelect(genre);
                  }}
                >
                  Browse Books
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenresList;