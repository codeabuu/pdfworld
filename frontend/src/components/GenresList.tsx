// GenresList.tsx - Optimized version with reduced size for regular genres
import { Button } from "@/components/ui/button";
import { Library, TrendingUp, Image as ImageIcon } from "lucide-react";
import { Genre } from "@/types/types";
import { getGenreImage, getFallbackGenreImage } from "@/lib/genreimages";
import { useState, useEffect, useMemo } from "react";

interface GenresListProps {
  genres: Genre[];
  popularGenres: Genre[];
  loading: boolean;
  onGenreSelect: (genre: Genre) => void;
  onNavigateBack: () => void;
}

const GenresList = ({ genres, popularGenres, loading, onGenreSelect, onNavigateBack }: GenresListProps) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  // Preload popular genre images
  useEffect(() => {
    if (popularGenres.length > 0) {
      const preloadImages = async () => {
        const imageUrls = popularGenres.map(genre => {
          const imagePath = getGenreImage(genre.name, genre.slug);
          return imagePath.startsWith('bg-gradient') ? null : imagePath;
        }).filter(Boolean) as string[];
        
        // Create a set of unique URLs to avoid duplicate loading
        const uniqueUrls = [...new Set(imageUrls)];
        
        const loadPromises = uniqueUrls.map(url => {
          return new Promise<void>((resolve) => {
            if (loadedImages.has(url)) {
              resolve();
              return;
            }
            
            const img = new Image();
            img.onload = () => {
              setLoadedImages(prev => new Set(prev).add(url));
              resolve();
            };
            img.onerror = () => resolve(); // Even if error, resolve to avoid blocking
            img.src = url;
          });
        });
        
        await Promise.all(loadPromises);
      };
      
      preloadImages();
    }
  }, [popularGenres, loadedImages]);

  const renderGenreSkeletons = () => (
    <>
      {/* Popular genres skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
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
      
      {/* Regular genres skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 18 }).map((_, index) => (
          <div key={index} className="bg-card rounded-lg border border-border overflow-hidden group cursor-wait">
            <div className="h-28 bg-muted animate-pulse rounded-t-lg flex items-center justify-center">
              <Library className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="p-3 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // Filter out popular genres from the main list to avoid duplicates
  const regularGenres = useMemo(() => 
    genres.filter(genre => 
      !popularGenres.some(popular => popular.slug === genre.slug)
    ), 
    [genres, popularGenres]
  );

  // Popular Genre card component with images
  const PopularGenreCard = ({ genre }: { genre: Genre }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const genreImage = getGenreImage(genre.name, genre.slug);
    const isCustomImage = !genreImage.startsWith('bg-gradient');
    const hasLoaded = loadedImages.has(genreImage) || imageLoaded;
    
    return (
      <div
        key={genre.slug}
        className="bg-card rounded-lg border-2 border-amber-200 hover:border-amber-300 overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={() => onGenreSelect(genre)}
      >
        {/* Genre Card with Image */}
        <div className={`h-40 relative overflow-hidden ${!isCustomImage || imageError ? getFallbackGenreImage(genre.name) : ''}`}>
          {isCustomImage && !imageError ? (
            <>
              {!hasLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
              <img 
                src={genreImage} 
                alt={genre.name}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${hasLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => {
                  setImageLoaded(true);
                  setLoadedImages(prev => new Set(prev).add(genreImage));
                }}
                onError={() => {
                  setImageError(true);
                }}
                loading="lazy"
              />
            </>
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
  };

  // Regular Genre card component (smaller, without images)
  const RegularGenreCard = ({ genre }: { genre: Genre }) => {
    const gradientClass = getFallbackGenreImage(genre.name);
    
    return (
      <div
        key={genre.slug}
        className="bg-card rounded-lg border border-border overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={() => onGenreSelect(genre)}
      >
        {/* Genre Card with Gradient Background (smaller) */}
        <div className={`h-28 relative ${gradientClass} flex items-center justify-center`}>
          <Library className="h-8 w-8 text-white opacity-90" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>

        {/* Genre Info (smaller) */}
        <div className="p-3 space-y-2">
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm">
            {genre.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {genre.book_count.toLocaleString()} books
          </p>

          <Button
            variant="secondary"
            size="sm"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onGenreSelect(genre);
            }}
          >
            Browse
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Browse Genres</h1>
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
            {popularGenres.map((genre) => (
              <PopularGenreCard key={genre.slug} genre={genre} />
            ))}
          </div>
        </div>
      )}

      {/* All Genres Section (Smaller cards with gradient backgrounds) */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">All Genres</h2>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, index) => (
              <div key={index} className="bg-card rounded-lg border border-border overflow-hidden group cursor-wait">
                <div className="h-28 bg-muted animate-pulse rounded-t-lg flex items-center justify-center">
                  <Library className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {regularGenres.map((genre) => (
              <RegularGenreCard key={genre.slug} genre={genre} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenresList;