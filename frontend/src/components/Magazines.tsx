import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { getMagazines } from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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

const Magazines = () => {
  const [newMagazines, setNewMagazines] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const fetchReleases = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMagazines();
        setNewMagazines(response.results);
      } catch (err) {
        setError("Failed to load magazines");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  const handleDownload = async (magazineUrl: string, title: string) => {
    if (isAuthLoading) {
      setError("Checking authentication...");
      return;
    }

    if (!isAuthenticated) {
      // Redirect to login page with return URL
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
        // Update auth status since we got a 401
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

      // Get file as blob and download
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

  const handleViewDetails = (magazine: Book) => {
    const slug = magazine.link.split('/').filter(Boolean).pop();
    if (slug) {
      const bookData = {
        ...magazine,
        image: getImageUrl(magazine.image),
      };

      navigate(`/book/${slug}`, {
        state: {
          fromMagazines: true,
          bookData,
          magazinesList: newMagazines,
        },
      });
    }
  };

  const getImageUrl = (url: string) => {
    try {
      const highQuality = getHighQualityImage(url);
      return highQuality || url;
    } catch {
      return url;
    }
  };

  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Latest Magazines & Newspapers</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back to Discovery
          </Button>
        </div>

        {error ? (
          <div className="text-center py-8 text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-0">
                  <div className="animate-pulse bg-gray-200 aspect-[2/3] rounded-t-lg"></div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <div className="h-8 w-full bg-gray-200 rounded"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newMagazines.map((book, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <div className="relative">
                  {/* Book Cover */}
                  <div className="h-64 rounded-t-lg relative overflow-hidden">
                    {book.image ? (
                      <img 
                        src={getHighQualityImage(book.image)} 
                        alt={book.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/300x450?text=Magazine+Cover';
                          target.onerror = null;
                        }}
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-gray-200 to-gray-300 w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                  </div>
                  
                  {/* Book Info */}
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold text-foreground line-clamp-2">
                      {book.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      by {book.author || "Unknown Author"}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    {/* <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewDetails(book)}
                    >
                      Details
                    </Button> */}
                    <Button 
                      variant="default"
                      className="flex-1"
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
                        "Download PDF"
                      )}
                    </Button>
                  </CardFooter>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Magazines;