// GenresList.tsx
import { Button } from "@/components/ui/button";
import { Library, TrendingUp } from "lucide-react";
import { Genre } from "@/types/types";
import { getGenreImage, getFallbackGenreImage } from "@/lib/genreimages"; // Import the helper functions

interface GenresListProps {
  genres: Genre[];
  popularGenres: Genre[];
  loading: boolean;
  onGenreSelect: (genre: Genre) => void;
  onNavigateBack: () => void;
}

const GenresList = ({ genres, popularGenres, loading, onGenreSelect, onNavigateBack }: GenresListProps) => {
  
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

  // Filter out popular genres from the main list to avoid duplicates
  const regularGenres = genres.filter(genre => 
    !popularGenres.some(popular => popular.slug === genre.slug)
  );

  return (
    <div className="space-y-8">
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
          Discover books from {regularGenres.length + popularGenres.length} different genres
        </p>
      </div>

      {/* Popular Genres Section with Images */}
      {popularGenres.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-foreground">Popular Genres</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {popularGenres.map((genre) => {
              const genreImage = getGenreImage(genre.name, genre.slug);
              const isCustomImage = !genreImage.startsWith('bg-gradient');
              console.log('Genre:', genre.name, 'Slug:', genre.slug, 'Image:', genreImage, 'IsCustom:', isCustomImage);
              
              return (
                <div
                  key={genre.slug}
                  className="bg-card rounded-lg border-2 border-amber-200 overflow-hidden group hover:shadow-lg hover:border-amber-300 transition-all duration-300 cursor-pointer"
                  onClick={() => onGenreSelect(genre)}
                >
                  {/* Genre Card with Image */}
                  <div className={`h-40 relative overflow-hidden ${!isCustomImage ? genreImage : ''}`}>
                    {isCustomImage ? (
                      <img 
                        src={genreImage} 
                        alt={genre.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.className = `${getFallbackGenreImage(genre.name)} h-40 relative overflow-hidden`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Library className="h-12 w-12 text-white opacity-90" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>

                  {/* Genre Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-foreground group-hover:text-amber-700 transition-colors line-clamp-2">
                      {genre.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {genre.book_count.toLocaleString()} books
                    </p>

                    <Button
                      variant="default"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGenreSelect(genre);
                      }}
                    >
                      Browse Books
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Genres Section (Regular gradient backgrounds) */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">All Genres</h2>
        
        {loading ? (
          renderGenreSkeletons()
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {regularGenres.map((genre) => (
              <div
                key={genre.slug}
                className="bg-card rounded-lg border border-border overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => onGenreSelect(genre)}
              >
                {/* Genre Card with Gradient Background */}
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
    </div>
  );
};

export default GenresList;