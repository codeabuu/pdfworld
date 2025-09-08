import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, Download, RefreshCw } from "lucide-react";
import { getMagazines } from "@/lib/api";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getHighQualityImage } from "@/lib/utils";
import { authService } from "@/services/Myauthservice";
import { useAuth } from "@/hooks/useAuth";

const API_BASE_URL = "http://127.0.0.1:8000/";

interface Book {
  title: string;
  link: string;
  image: string;
  author: string;
  date?: string;
}

// Image cache with expiration
const imageCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const Magazines = () => {
  const [newMagazines, setNewMagazines] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Check if we need to refresh due to failed images
  useEffect(() => {
    if (!hasRefreshed && failedImages.size > 0 && failedImages.size >= newMagazines.length / 2) {
      // If more than half of images failed to load, refresh once
      const timer = setTimeout(() => {
        console.log('Refreshing page due to image loading issues');
        setHasRefreshed(true);
        window.location.reload();
      }, 3000); // Wait 3 seconds before refreshing
      
      return () => clearTimeout(timer);
    }
  }, [failedImages, newMagazines.length, hasRefreshed]);

  useEffect(() => {
    const fetchReleases = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMagazines();
        setNewMagazines(response.results);
        
        // Preload images with priority
        response.results.forEach((book: Book, index: number) => {
          // Load first 4 images immediately, others with delay
          if (index < 4) {
            preloadImage(book.image);
          } else {
            setTimeout(() => preloadImage(book.image), index * 100);
          }
        });
      } catch (err) {
        setError("Failed to load magazines");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  const preloadImage = (url: string) => {
    if (!url) return;
    
    // Check cache with expiry
    const cached = imageCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      if (cached.status === 'loaded') {
        setLoadedImages(prev => new Set(prev).add(url));
      }
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, { status: 'loaded', timestamp: Date.now() });
      setLoadedImages(prev => new Set(prev).add(url));
    };
    img.onerror = () => {
      imageCache.set(url, { status: 'error', timestamp: Date.now() });
      setFailedImages(prev => new Set(prev).add(url));
    };
    
    // Use WebP if supported, otherwise fallback
    const optimizedUrl = getHighQualityImage(url);
    img.src = optimizedUrl;
    
    // Set timeout to avoid hanging requests
    setTimeout(() => {
      if (!img.complete) {
        img.src = ''; // Cancel the request
        imageCache.set(url, { status: 'timeout', timestamp: Date.now() });
        setFailedImages(prev => new Set(prev).add(url));
      }
    }, 10000); // 10 second timeout
  };

  const handleDownload = async (magazineUrl: string, title: string) => {
    if (isAuthLoading) {
      setError("Checking authentication...");
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please log in to download magazines' 
        } 
      });
      return;
    }
    
    try {
      setIsDownloading(true);
      setDownloadingId(magazineUrl);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}api/download-magazine/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          url: magazineUrl,
        }),
      });

      if (response.status === 401) {
        const authCheck = await authService.checkAuth();
        if (!authCheck) {
          navigate('/login', { 
            state: { 
              from: location.pathname,
              message: 'Your session expired. Please log in again to download.' 
            } 
          });
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Download failed:", err);
      setError(err instanceof Error ? err.message : "Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
      setDownloadingId(null);
    }
  };

  const getImageUrl = (url: string) => {
    try {
      return getHighQualityImage(url) || url;
    } catch {
      return url;
    }
  };

  // Memoize the image URLs to prevent unnecessary recalculations
  const memoizedMagazines = useMemo(() => {
    return newMagazines.map(book => ({
      ...book,
      optimizedImage: getImageUrl(book.image),
      isCached: loadedImages.has(book.image) || imageCache.has(book.image)
    }));
  }, [newMagazines, loadedImages]);

  // Function to get optimized image URL with quality parameters
  const getOptimizedImageUrl = (url: string, width: number = 300, quality: number = 80) => {
    try {
      const baseUrl = getHighQualityImage(url) || url;
      // Add query parameters for optimization (if your backend supports it)
      if (baseUrl.includes('?')) {
        return `${baseUrl}&w=${width}&q=${quality}`;
      }
      return `${baseUrl}?w=${width}&q=${quality}`;
    } catch {
      return url;
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    setHasRefreshed(true);
    window.location.reload();
  };

  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        {/* Mobile Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
          <div className="flex items-center mb-4 sm:mb-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="mr-3 sm:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
              Magazines & Newspapers
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {failedImages.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Images
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="hidden sm:flex"
            >
              Back to Discovery
            </Button>
          </div>
        </div>

        {/* Loading indicator for images */}
        {failedImages.size > 0 && !hasRefreshed && (
          <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              <span>Having trouble loading images. Page will refresh automatically...</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleManualRefresh}>
              Refresh Now
            </Button>
          </div>
        )}

        {error ? (
          <div className="text-center py-8 text-destructive">
            {error}
          </div>
        ) : loading ? (
          <>
            {/* Mobile horizontal loading skeletons */}
            <div className="sm:hidden space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="flex p-3">
                  <div className="w-24 h-32 bg-muted rounded-lg animate-pulse flex-shrink-0"></div>
                  <div className="ml-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="h-8 bg-muted rounded animate-pulse"></div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Desktop grid loading skeletons */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <div className="aspect-[3/4] rounded-t-lg bg-muted animate-pulse"></div>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <div className="h-8 w-full bg-muted rounded animate-pulse"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Mobile horizontal layout */}
            <div className="sm:hidden space-y-4">
              {memoizedMagazines.map((book, index) => (
                <Card key={index} className="flex p-3 group">
                  {/* Magazine Cover - Horizontal */}
                  <div className="w-24 h-32 rounded-lg relative overflow-hidden flex-shrink-0">
                    {book.image ? (
                      <img 
                        src={getOptimizedImageUrl(book.image, 96, 70)} 
                        alt={book.title} 
                        className="w-full h-full object-cover transition-opacity duration-300"
                        loading={index < 4 ? "eager" : "lazy"}
                        style={{ 
                          opacity: book.isCached ? 1 : 0.7,
                          transition: 'opacity 0.3s ease-in-out'
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.opacity = '1';
                          if (!loadedImages.has(book.image)) {
                            setLoadedImages(prev => new Set(prev).add(book.image));
                          }
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/96x128/f3f4f6/9ca3af?text=Magazine';
                          target.onerror = null;
                          target.style.opacity = '1';
                          setFailedImages(prev => new Set(prev).add(book.image));
                        }}
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-muted to-muted/80 w-full h-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300"></div>
                  </div>
                  
                  {/* Magazine Info */}
                  <div className="ml-4 flex-1 flex flex-col justify-between min-h-32">
                    <div>
                      <h4 className="font-semibold text-foreground line-clamp-2 text-sm mb-1">
                        {book.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        by {book.author || "Unknown Author"}
                      </p>
                    </div>
                    
                    {/* Download Button */}
                    <Button 
                      variant="default"
                      className="w-full text-xs h-8 mt-2"
                      onClick={() => handleDownload(book.link, book.title)}
                      disabled={isDownloading && downloadingId === book.link}
                    >
                      {isDownloading && downloadingId === book.link ? (
                        <>
                          <svg 
                            className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                          >
                            <circle 
                              className="opacity-25" 
                              cx="12" 
                              cy="12" 
                              r="10" 
                              stroke="currentColor" 
                              strokeWidth="4"
                            ></circle>
                            <path 
                              className="opacity-75" 
                              fill="currentColor" 
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Loading
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop grid layout */}
            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {memoizedMagazines.map((book, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow group flex flex-col h-full">
                  <div className="flex flex-col h-full">
                    {/* Magazine Cover - Vertical */}
                    <div className="aspect-[3/4] rounded-t-lg relative overflow-hidden flex-shrink-0">
                      {book.image ? (
                        <img 
                          src={getOptimizedImageUrl(book.image, 300, 80)} 
                          alt={book.title} 
                          className="w-full h-full object-cover transition-opacity duration-300"
                          loading={index < 8 ? "eager" : "lazy"}
                          style={{ 
                            opacity: book.isCached ? 1 : 0.7,
                            transition: 'opacity 0.3s ease-in-out'
                          }}
                          onLoad={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.opacity = '1';
                            if (!loadedImages.has(book.image)) {
                              setLoadedImages(prev => new Set(prev).add(book.image));
                            }
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/300x400/f3f4f6/9ca3af?text=Magazine';
                            target.onerror = null;
                            target.style.opacity = '1';
                            setFailedImages(prev => new Set(prev).add(book.image));
                          }}
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-muted to-muted/80 w-full h-full flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300"></div>
                    </div>
                    
                    {/* Magazine Info */}
                    <CardContent className="p-4 space-y-2 flex-grow">
                      <h4 className="font-semibold text-foreground line-clamp-2 text-base">
                        {book.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        by {book.author || "Unknown Author"}
                      </p>
                    </CardContent>
                    
                    {/* Download Button */}
                    <CardFooter className="p-4 pt-0">
                      <Button 
                        variant="default"
                        className="w-full text-sm h-9"
                        onClick={() => handleDownload(book.link, book.title)}
                        disabled={isDownloading && downloadingId === book.link}
                      >
                        {isDownloading && downloadingId === book.link ? (
                          <>
                            <svg 
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                              xmlns="http://www.w3.org/2000/svg" 
                              fill="none" 
                              viewBox="0 0 24 24"
                            >
                              <circle 
                                className="opacity-25" 
                                cx="12" 
                                cy="12" 
                                r="10" 
                                stroke="currentColor" 
                                strokeWidth="4"
                              ></circle>
                              <path 
                                className="opacity-75" 
                                fill="currentColor" 
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Downloading
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && newMagazines.length === 0 && !error && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No magazines available</h3>
            <p className="text-muted-foreground">Check back later for new releases</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Magazines;