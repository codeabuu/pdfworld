import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { getHighQualityImage } from "@/lib/utils";
import { SearchResult } from "@/types/types";

interface SearchResultsProps {
  searchResults: SearchResult[];
  isSearchLoading: boolean;
  searchError: string;
  searchQuery: string;
  handleBookClick: (book: SearchResult) => void;
  handleClearSearch: () => void;
}

export const SearchResults = ({
  searchResults,
  isSearchLoading,
  searchError,
  searchQuery,
  handleBookClick,
  handleClearSearch
}: SearchResultsProps) => {
  if (isSearchLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (searchError) {
    return (
      <div className="text-center py-12 text-destructive">{searchError}</div>
    );
  }

  if (searchResults.length > 0) {
    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Search Results for "{searchQuery}"
          </h2>
          <Button
            variant="outline"
            onClick={handleClearSearch}
            className="text-sm"
          >
            Clear Search
          </Button>
        </div>
        
        {/* Mobile Results */}
        <div className="space-y-3 lg:hidden">
          {searchResults.map((book, index) => (
            <div 
              key={index} 
              className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleBookClick(book)}
            >
              <div className="w-16 h-24 flex-shrink-0">
                <img
                  src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                  alt={book.title}
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {book.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                  by {book.author || "Unknown Author"}
                </p>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700 text-xs h-7"
                  onClick={(e) => { e.stopPropagation(); handleBookClick(book); }}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Results */}
        <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {searchResults.map((book, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="p-0">
                <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                  <img
                    src={getHighQualityImage(book.image) || "/placeholder-book.jpg"}
                    alt={book.title}
                    className="object-cover w-full"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {book.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  by {book.author || "Unknown Author"}
                </p>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <Button 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-xs h-7"
                  onClick={() => handleBookClick(book)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (searchQuery) {
    return (
      <div className="text-center py-12">
        <p>No results found for "{searchQuery}"</p>
        <Button
          variant="link"
          onClick={handleClearSearch}
          className="mt-4"
        >
          Clear search
        </Button>
      </div>
    );
  }

  return null;
};