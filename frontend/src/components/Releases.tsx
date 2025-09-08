import { useState, useEffect } from "react"; 
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { getNewReleases } from "@/lib/api";
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
    const slug = book.link.split("/").filter(Boolean).pop();
    if (slug) {
      navigate(`/dashboard/book/${slug}`, {
        state: {
          fromReleases: true,
          bookData: book,
          releasesList: newReleases,
        },
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
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-row sm:flex-col items-start sm:items-stretch gap-4 p-4 rounded-lg border animate-pulse"
              >
                <div className="w-24 h-32 sm:w-full sm:h-64 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded mt-3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newReleases.map((book, index) => (
              <div
                key={index}
                className="card-book group cursor-pointer"
                onClick={() => handleViewDetails(book)}
              >
                {/* Mobile: horizontal flex | Desktop: vertical card */}
                <div className="flex flex-row sm:block gap-4 p-4 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none hover:shadow-md transition-shadow">
                  
                  {/* Book Cover */}
                  <div
                    className="w-24 h-32 sm:w-full sm:h-64 rounded-lg overflow-hidden shrink-0 mb-0 sm:mb-4 relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {book.image ? (
                      <img
                        src={getHighQualityImage(book.image)}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(book);
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/150x225?text=No+Cover";
                        }}
                      />
                    ) : (
                      <div
                        className="bg-gradient-to-br from-gray-200 to-gray-300 w-full h-full flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(book);
                        }}
                      >
                        <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                      </div>
                    )}
                    {/* desktop hover overlay */}
                    <div className="hidden sm:block absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                  </div>

                  {/* Book Info */}
                  <div className="flex flex-col justify-between sm:block flex-1">
                    <div className="p-0 sm:p-4 sm:space-y-2">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {book.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        by {book.author || "Unknown Author"}
                      </p>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:p-4">
                      <Button
                        className="w-full btn-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(book);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Releases;
