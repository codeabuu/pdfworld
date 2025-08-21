import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, BookOpen, TrendingUp, Clock, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getNewReleases } from "@/lib/api";
import { getHighQualityImage } from "@/lib/utils";

interface Book {
  title: string;
  link: string;
  image: string;
  author: string;
  date?: string;
}

const BookDiscovery = () => {
  const [activeGenre, setActiveGenre] = useState("All");
  const [featuredBooks, setFeaturedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // const highQualityImage = getHighQualityImage(book.image);
  
  const genres = [
    { name: "All", color: "bg-primary", icon: BookOpen },
    { name: "Fantasy", color: "bg-purple-500", icon: Star },
    { name: "Romance", color: "bg-pink-500", icon: Heart },
    { name: "Sci-Fi", color: "bg-blue-500", icon: TrendingUp },
    { name: "Mystery", color: "bg-gray-600", icon: Clock },
    { name: "Biography", color: "bg-green-500", icon: Users },
  ];

  // const trendingAuthors = [
  //   { name: "Sarah Chen", specialty: "Fantasy & Sci-Fi", books: "23 books", avatar: "bg-purple-400" },
  //   { name: "Mike Johnson", specialty: "Tech & Innovation", books: "15 books", avatar: "bg-blue-400" },
  //   { name: "Emma Wilson", specialty: "Mystery & Thriller", books: "31 books", avatar: "bg-gray-600" },
  //   { name: "David Park", specialty: "Romance & Drama", books: "18 books", avatar: "bg-pink-400" },
  // ];

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        const response = await getNewReleases();
        // Take the first 4 books from new releases
        const topBooks = response.results.slice(0, 4).map((book: Book, index: number) => ({
          id: index + 1,
          title: book.title,
          author: book.author || "Unknown Author",
          image: book.image,
          rating: getRandomRating(), // Keep random ratings for now
          // genre: getRandomGenre(),
          isNew: true, // All new releases are new by definition
          readers: getRandomReadersCount(),
          link: book.link
        }));
        setFeaturedBooks(topBooks);
      } catch (error) {
        console.error("Failed to fetch new releases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewReleases();
  }, []);

  // Helper functions to generate mock data for ratings, genres, and readers
  const getRandomRating = () => {
    return (Math.random() * (5 - 4.4) + 4.4).toFixed(1); // Random rating between 4.4 and 5.0
  };

  const getRandomGenre = () => {
    const genres = ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Thriller", "Biography"];
    return genres[Math.floor(Math.random() * genres.length)];
  };

  const getRandomReadersCount = () => {
    const count = Math.floor(Math.random() * 20) + 5; // Between 5K and 25K
    return `${count}K`;
  };
  const handlePreviewClick = (book: any) => {
    // Extract the slug from the book link
    const slug = book.link.split('/').filter(Boolean).pop();
    if (slug) {
      navigate(`/book/${slug}`, {
        state: {
          fromDiscovery: true,
          bookData: book // Pass the book data for immediate display
        }
      });
    }
  };

  if (loading) {
    return (
      <section id="browse" className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card-book">
                <div className="animate-pulse">
                  <div className="h-64 rounded-lg mb-4 bg-gray-200"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-8 mt-4 bg-gray-200 rounded"></div>
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
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Discover Your Next 
            <span className="text-primary"> Favorite Book</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From bestselling novels to hidden gems, explore our curated collection of over 50,000 books
          </p>
        </div>

        {/* Genre Filter */}
        <div id="genres" className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 text-foreground">Browse by Genre</h3>
          <div className="flex flex-wrap gap-3">
            {genres.map((genre) => {
              const IconComponent = genre.icon;
              return (
                <Button
                  key={genre.name}
                  variant={activeGenre === genre.name ? "default" : "outline"}
                  className={`h-12 px-6 rounded-full transition-all duration-300 hover-lift ${
                    activeGenre === genre.name
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => setActiveGenre(genre.name)}
                >
                  <IconComponent className="mr-2 h-4 w-4" />
                  {genre.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Featured New Releases */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-semibold text-foreground">Featured New Releases</h3>
            <Link to="/releases">
              <Button variant="outline" className="hover-lift">
                View All
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <div key={book.id} className="card-book group" onClick={() => handlePreviewClick(book)}>
                <div className="relative">
                  {/* Book Cover */}
                  
                  <div className="h-64 rounded-lg mb-4 relative overflow-hidden">
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
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                    {book.isNew && (
                      <Badge className="absolute top-3 left-3 bg-success text-success-foreground">
                        New
                      </Badge>
                    )}
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-sm backdrop-blur-sm">
                      {book.readers} readers
                    </div>
                  </div>
                  
                  {/* Book Info */}
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                      {book.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">by {book.author}</p>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-gold text-gold" />
                        <span className="text-sm font-medium">{book.rating}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {book.genre}
                      </Badge>
                    </div>
                    
                    <Button className="w-full mt-3 btn-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                    onClick={(e) => { e.stopPropagation(); handlePreviewClick(book); }}>
                      Preview
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Authors */}
        {/* <div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-semibold text-foreground">Trending Authors</h3>
            <Button variant="outline" className="hover-lift">
              View All Authors
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingAuthors.map((author, index) => (
              <div key={index} className="card-elevated p-6 text-center group cursor-pointer">
                <div className={`${author.avatar} w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform duration-300`}>
                  {author.name.charAt(0)}
                </div>
                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                  {author.name}
                </h4>
                <p className="text-sm text-muted-foreground mb-2">{author.specialty}</p>
                <Badge variant="secondary" className="text-xs">
                  {author.books}
                </Badge>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default BookDiscovery;