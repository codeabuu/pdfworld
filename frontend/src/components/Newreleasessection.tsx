import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Eye } from "lucide-react";
import { getHighQualityImage } from "@/lib/utils";
import { Book } from "@/types/types";

interface NewReleasesSectionProps {
  newReleases: Book[];
  loading: boolean;
  handleBookClick: (book: Book) => void;
  renderLoadingSkeleton: (count: number, type: 'book' | 'genre' | 'magazine') => JSX.Element;
}

export const NewReleasesSection = ({ 
  newReleases, 
  loading, 
  handleBookClick, 
  renderLoadingSkeleton 
}: NewReleasesSectionProps) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-amber-600" />
          <h2 className="text-2xl font-semibold text-foreground">New Releases</h2>
        </div>
        <Link to="/dashboard/releases">
          <Button variant="outline" className="gap-1 text-sm" size="sm">
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {loading ? (
        renderLoadingSkeleton(4, 'book')
      ) : (
        <>
          {/* Mobile view */}
          <div className="space-y-4 sm:hidden">
            {newReleases.map((book, index) => (
              <div
                key={index}
                className="flex items-center gap-4 border border-gray-200 rounded-lg p-3 bg-white hover:bg-amber-50 transition cursor-pointer"
                onClick={() => handleBookClick(book)}
              >
                <img
                  src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                  alt={book.title}
                  className="w-16 h-20 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-amber-700">
                    {book.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    by {book.author || "Unknown Author"}
                  </p>
                </div>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-700 text-xs">
                  <Eye className="h-3 w-3 mr-1" /> View Details
                </Button>
              </div>
            ))}
          </div>
          
          {/* Desktop view */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-5">
            {newReleases.map((book, index) => (
              <Card
                key={index}
                className="group cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
              >
                <CardHeader className="p-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                    <img
                      src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                      alt={book.title}
                      className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 left-2 bg-green-600 text-white text-xs">
                      New
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-amber-700 transition-colors text-sm">
                    {book.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    by {book.author || "Unknown Author"}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 rounded-md"
                    onClick={() => handleBookClick(book)}
                  >
                    <Eye className="h-3 w-3" />
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </section>
  );
};