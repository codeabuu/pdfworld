import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, BookOpen, TrendingUp, Clock, Users, Newspaper } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getNewReleases, getMagazines } from "@/lib/api";
import { getHighQualityImage } from "@/lib/utils";

interface Book {
  title: string;
  link: string;
  image: string;
  author: string;
  date?: string;
}

interface Magazine {
  id: number;
  title: string;
  image: string;
  issue: string;
  date: string;
  category: string;
}

const BookDiscovery = () => {
  const [activeGenre, setActiveGenre] = useState("All");
  const [featuredBooks, setFeaturedBooks] = useState<any[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [magazinesLoading, setMagazinesLoading] = useState(true);
  const navigate = useNavigate();

  const genres = [
    { name: "All", color: "bg-primary", icon: BookOpen },
    { name: "Fantasy", color: "bg-purple-500", icon: Star },
    { name: "Romance", color: "bg-pink-500", icon: Heart },
    { name: "Sci-Fi", color: "bg-blue-500", icon: TrendingUp },
    { name: "Mystery", color: "bg-gray-600", icon: Clock },
    { name: "Biography", color: "bg-green-500", icon: Users },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [releasesResponse, magazinesResponse] = await Promise.all([
          getNewReleases(),
          getMagazines()
        ]);

        // Process books
        const topBooks = releasesResponse.results.slice(0, 4).map((book: Book, index: number) => ({
          id: index + 1,
          title: book.title,
          author: book.author || "Unknown Author",
          image: book.image,
          rating: (Math.random() * (5 - 4.4) + 4.4).toFixed(1),
          genre: ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Thriller", "Biography"][Math.floor(Math.random() * 6)],
          isNew: true,
          readers: `${Math.floor(Math.random() * 20) + 5}K`,
          link: book.link
        }));

        // Process magazines
        const featuredMagazines = magazinesResponse.results.slice(0, 4);

        setFeaturedBooks(topBooks);
        setMagazines(featuredMagazines);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
        setMagazinesLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePreviewClick = (book: any) => {
    const slug = book.link.split('/').filter(Boolean).pop();
    if (slug) {
      navigate(`/book/${slug}`, {
        state: { fromDiscovery: true, bookData: book }
      });
    }
  };

  const handleMagazineClick = (magazine: Magazine) => {
    navigate(`/magazine/${magazine.id}`, {
      state: { magazineData: magazine }
    });
  };

  if (loading) {
    return (
      <section id="browse" className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card-book">
                <div className="animate-pulse">
                  <div className="h-48 sm:h-64 rounded-lg mb-3 sm:mb-4 bg-gray-200"></div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-8 mt-2 sm:mt-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="genres" className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Discover Your Next 
            <span className="text-primary"> Favorite Book</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            From bestselling novels to hidden gems, explore our curated collection
          </p>
        </div>

        {/* Genre Filter - Mobile responsive */}
        <div id="genres" className="mb-8 sm:mb-12">
          <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-foreground">Browse by Genre</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {genres.map((genre) => {
              const IconComponent = genre.icon;
              return (
                <Button
                  key={genre.name}
                  variant={activeGenre === genre.name ? "default" : "outline"}
                  size="sm"
                  className={`h-10 sm:h-12 px-4 sm:px-6 rounded-full transition-all duration-300 hover-lift text-xs sm:text-sm ${
                    activeGenre === genre.name
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => setActiveGenre(genre.name)}
                >
                  <IconComponent className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {genre.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Featured New Releases */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-2xl sm:text-3xl font-semibold text-foreground">Featured New Releases</h3>
            <Link to="/releases">
              <Button variant="outline" size="sm" className="hover-lift text-xs sm:text-sm">
                View All
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredBooks.map((book) => (
              <div key={book.id} className="card-book group" onClick={() => handlePreviewClick(book)}>
                <div className="relative">
                  {/* Book Cover */}
                  <div className="h-48 sm:h-64 rounded-lg mb-3 sm:mb-4 relative overflow-hidden">
                    {book.image ? (
                      <img 
                        src={getHighQualityImage(book.image)} 
                        alt={book.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x225?text=No+Cover';
                        }}
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-gray-200 to-gray-300 w-full h-full flex items-center justify-center">
                        <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                    {book.isNew && (
                      <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-success text-success-foreground text-[10px] sm:text-xs">
                        New
                      </Badge>
                    )}
                    <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/50 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs sm:text-sm backdrop-blur-sm">
                      {book.readers} readers
                    </div>
                  </div>
                  
                  {/* Book Info */}
                  <div className="p-3 sm:p-4 space-y-1 sm:space-y-2">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300 text-sm sm:text-base line-clamp-2">
                      {book.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                      by {book.author}
                    </p>
                    
                    <div className="flex items-center justify-between pt-1 sm:pt-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-gold text-gold" />
                        <span className="text-xs sm:text-sm font-medium">{book.rating}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {book.genre}
                      </Badge>
                    </div>
                    
                    <Button className="w-full mt-2 sm:mt-3 text-xs sm:text-sm h-8 sm:h-9 btn-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                    onClick={(e) => { e.stopPropagation(); handlePreviewClick(book); }}>
                      Preview
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Magazines Section */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              <h3 className="text-2xl sm:text-3xl font-semibold text-foreground">Latest Magazines</h3>
            </div>
            <Link to="/magazines">
              <Button variant="outline" size="sm" className="hover-lift text-xs sm:text-sm">
                View All
              </Button>
            </Link>
          </div>
          
          {magazinesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-40 sm:h-48 rounded-lg mb-3 sm:mb-4 bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-8 mt-2 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {magazines.map((magazine) => (
                <div 
                  key={magazine.id} 
                  className="card-book group cursor-pointer"
                  onClick={() => handleMagazineClick(magazine)}
                >
                  <div className="relative">
                    {/* Magazine Cover */}
                    <div className="h-40 sm:h-48 rounded-lg mb-3 sm:mb-4 relative overflow-hidden">
                      {magazine.image ? (
                        <img 
                          src={getHighQualityImage(magazine.image)} 
                          alt={magazine.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x200?text=No+Cover';
                          }}
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-full h-full flex items-center justify-center">
                          <Newspaper className="h-8 w-8 sm:h-12 sm:w-12 text-blue-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                      <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-blue-600 text-white text-[10px] sm:text-xs">
                        {magazine.category}
                      </Badge>
                    </div>
                    
                    {/* Magazine Info */}
                    <div className="p-3 sm:p-4 space-y-1 sm:space-y-2">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300 text-sm sm:text-base line-clamp-2">
                        {magazine.title}
                      </h4>
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5 sm:space-y-1">
                        <p className="line-clamp-1">Issue: {magazine.issue}</p>
                        <p className="line-clamp-1">{new Date(magazine.date).toLocaleDateString()}</p>
                      </div>
                      
                      <Button 
                        className="w-full mt-2 sm:mt-3 text-xs sm:text-sm h-8 sm:h-9 btn-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        onClick={(e) => { e.stopPropagation(); handleMagazineClick(magazine); }}
                      >
                        Read Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BookDiscovery;