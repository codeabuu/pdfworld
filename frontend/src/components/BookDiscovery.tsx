import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, BookOpen, TrendingUp, Clock, Users } from "lucide-react";

const BookDiscovery = () => {
  const [activeGenre, setActiveGenre] = useState("All");

  const genres = [
    { name: "All", color: "bg-primary", icon: BookOpen },
    { name: "Fantasy", color: "bg-purple-500", icon: Star },
    { name: "Romance", color: "bg-pink-500", icon: Heart },
    { name: "Sci-Fi", color: "bg-blue-500", icon: TrendingUp },
    { name: "Mystery", color: "bg-gray-600", icon: Clock },
    { name: "Biography", color: "bg-green-500", icon: Users },
  ];

  const featuredBooks = [
    {
      id: 1,
      title: "The Digital Realm",
      author: "Sarah Chen",
      cover: "bg-gradient-to-br from-purple-400 to-pink-400",
      rating: 4.8,
      genre: "Fantasy",
      isNew: true,
      readers: "12.5K",
    },
    {
      id: 2,
      title: "Code & Coffee",
      author: "Mike Johnson",
      cover: "bg-gradient-to-br from-blue-400 to-cyan-400",
      rating: 4.6,
      genre: "Tech",
      isNew: false,
      readers: "8.2K",
    },
    {
      id: 3,
      title: "Midnight Stories",
      author: "Emma Wilson",
      cover: "bg-gradient-to-br from-gray-600 to-gray-800",
      rating: 4.9,
      genre: "Mystery",
      isNew: true,
      readers: "15.1K",
    },
    {
      id: 4,
      title: "Hearts in Silicon",
      author: "David Park",
      cover: "bg-gradient-to-br from-pink-400 to-red-400",
      rating: 4.7,
      genre: "Romance",
      isNew: false,
      readers: "9.8K",
    },
  ];

  const trendingAuthors = [
    { name: "Sarah Chen", specialty: "Fantasy & Sci-Fi", books: "23 books", avatar: "bg-purple-400" },
    { name: "Mike Johnson", specialty: "Tech & Innovation", books: "15 books", avatar: "bg-blue-400" },
    { name: "Emma Wilson", specialty: "Mystery & Thriller", books: "31 books", avatar: "bg-gray-600" },
    { name: "David Park", specialty: "Romance & Drama", books: "18 books", avatar: "bg-pink-400" },
  ];

  return (
    <section id="browse" className="section-padding bg-background">
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
            <Button variant="outline" className="hover-lift">
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <div key={book.id} className="card-book group">
                <div className="relative">
                  {/* Book Cover */}
                  <div className={`${book.cover} h-64 rounded-lg mb-4 relative overflow-hidden`}>
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
                    
                    <Button className="w-full mt-3 btn-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      Preview
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Authors */}
        <div>
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
        </div>
      </div>
    </section>
  );
};

export default BookDiscovery;