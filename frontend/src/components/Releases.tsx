import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { getNewReleases } from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { getHighQualityImage } from "@/lib/utils";

interface Book {
  title: string;
  link: string;
  image: string;
  author: string;
  date?: string;
}

const Releases = () => {
  const [newReleases, setNewReleases] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchReleases = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getNewReleases();
        setNewReleases(response.results);
      } catch (err) {
        setError("Failed to load new releases");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  const handleViewDetails = (book: Book) => {
    // Extract slug from the book.link (last part of URL)
    const slug = book.link.split('/').filter(Boolean).pop();
    if (slug) {
      navigate(`/book/${slug}`, {
        state: {
          fromReleases: true,
          bookData: book, // Pass the book data for immediate display
          releasesList: newReleases // Pass the full list for potential navigation
        }
      });
    }
  };

  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">All New Releases</h1>
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newReleases.map((book, index) => (
                <div key={index} className="card-book group" onClick={() => handleViewDetails(book)}>
                  <div className="relative">
                    {/* Book Cover */}
                    <div className="h-64 rounded-lg mb-4 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      {book.image ? (
                        <img 
                          src={getHighQualityImage(book.image)} 
                          alt={book.title} 
                          className="w-full h-full object-cover"
                          onClick={(e) => { e.stopPropagation(); handleViewDetails(book); } }
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x225?text=No+Cover';
                          }}
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-gray-200 to-gray-300 w-full h-full flex items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(book); }}
                        >
                          <BookOpen className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                    </div>
                    
                    {/* Book Info */}
                    <div className="p-4 space-y-2">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {book.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        by {book.author || "Unknown Author"}
                      </p>
                      
                      <Button 
                        className="w-full mt-3 btn-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(book); }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Releases;