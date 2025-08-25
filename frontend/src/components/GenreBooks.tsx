// GenreBooks.tsx
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, Loader, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { getHighQualityImage } from "@/lib/utils";
import { GenreBooksProps } from "@/types/types";
import { useNavigate } from "react-router-dom";

const GenreBooks = ({
  genre,
  books,
  currentPage,
  totalPages,
  loading,
  onPageChange,
  onBookSelect,
  onBackToGenres
}: GenreBooksProps) => {

  const handleViewDetails = (book: any) => {
    const slug = book.link.split("/").filter(Boolean).pop();
    if (slug) {
      navigate(`/dashboard/book/${slug}`, {
        state: {
          fromGenre: true,
          genreName: genre.name,
          bookData: book,
          booksList: books,
          currentPage: currentPage
        }
      });
    }
  };
  const navigate = useNavigate();
  
  // Calculate total pages based on book count (7 books per page)
  const calculatedTotalPages = Math.ceil(genre.book_count / 7);
  const displayTotalPages = Math.max(totalPages, calculatedTotalPages);
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (displayTotalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= displayTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of visible pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(displayTotalPages - 1, currentPage + 1);
      
      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = 4;
      }
      
      // Adjust if we're near the end
      if (currentPage >= displayTotalPages - 2) {
        startPage = displayTotalPages - 3;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < displayTotalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      pages.push(displayTotalPages);
    }
    
    return pages;
  };

  const renderBookSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-card rounded-lg border border-border overflow-hidden group cursor-wait">
          <div className="h-64 bg-muted animate-pulse rounded-t-lg"></div>
          <div className="p-4 space-y-3">
            <div className="h-5 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            <div className="h-9 bg-muted rounded mt-3 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const handlePageButtonClick = (page: number) => {
    onPageChange(page);
  };

  const handleBack = () => {
    navigate(-1); // Simple back navigation
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-foreground">
          {genre.name} Books
        </h1>
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>

      {/* Book Count and Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-lg">
          {genre.book_count.toLocaleString()} books available • Page {currentPage} of {displayTotalPages}
        </p>
        
        {/* Previous/Next Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || loading}
            onClick={() => handlePageButtonClick(currentPage - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === displayTotalPages || loading}
            onClick={() => handlePageButtonClick(currentPage + 1)}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Books Grid */}
      {loading && books.length === 0 ? (
        renderBookSkeletons()
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {books.map((book, index) => (
              <div
                key={`${book.link}-${index}-${currentPage}`}
                className="bg-card rounded-lg border border-border overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => handleViewDetails(book)}
              >
                {/* Book Cover */}
                <div className="h-64 relative overflow-hidden">
                  {book.image ? (
                    <img
                      src={getHighQualityImage(book.image)}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x225?text=No+Cover';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/70 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                {/* Book Info */}
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    by {book.author || "Unknown Author"}
                  </p>
                  {book.date && (
                    <p className="text-xs text-muted-foreground">
                      {book.date}
                    </p>
                  )}

                  <Button
                    variant="secondary"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(book);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            {/* Page Info */}
            <div className="text-sm text-muted-foreground">
              Showing {books.length} books on page {currentPage} of {displayTotalPages}
            </div>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || loading}
                onClick={() => handlePageButtonClick(currentPage - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Numbers */}
              {getPageNumbers().map((page, index) => {
                if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      disabled
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  );
                }
                
                const pageNum = page as number;
                return (
                  <Button
                    key={index}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageButtonClick(pageNum)}
                    disabled={loading}
                    className="h-8 w-8 p-0 font-medium"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === displayTotalPages || loading}
                onClick={() => onPageChange(currentPage + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Load More Button (for mobile/infinite scroll) */}
            {/* {currentPage < displayTotalPages && (
              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={loading}
                variant="outline"
                className="gap-2 sm:hidden"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load Page ${currentPage + 1}`
                )}
              </Button>
            )} */}
          </div>

          {/* Books per page info */}
          {/* <div className="text-center text-sm text-muted-foreground">
            <p>{books.length} books per page • {genre.book_count.toLocaleString()} total books</p>
            <p className="text-xs">(Calculated: {Math.ceil(genre.book_count / 7)} pages needed)</p>
          </div> */}
        </>
      )}
    </div>
  );
};

export default GenreBooks;