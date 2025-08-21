import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getBookDetails } from '@/lib/api';
import { getHighQualityImage } from '@/lib/utils';


const API_BASE_URL = "http://127.0.0.1:8000/";


interface BookDetails {
  title: string;
  author: string;
  publish_date: string;
  description: string[];
  summary: string;
  image?: string;
  book_link: string;
  metadata: {
    full_book_name: string;
    author_name: string;
    book_genre: string;
    date_of_publication: string;
    edition_language: string;
    pdf_file_size: string;
    epub_file_size: string;
    [key: string]: string; // For other dynamic properties
  };
  download_options: Array<{
    type: string;
    method: 'GET' | 'POST';
    url?: string;
    data?: Record<string, string>;
    filename?: string;
  }>;
}

export default function BookDetail() {
  const { book_slug } = useParams();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  useEffect(() => {
    
    const fetchBookDetails = async () => {
      try {
        if (!book_slug) {
          throw new Error('No book slug provided');
        }

        // Extract the clean slug (last part of URL)
        const cleanSlug = book_slug?.split('/').filter(Boolean).pop() || '';
        
        // First fetch the main book details
        const data = await getBookDetails(cleanSlug);
        
        if (data.status === 'success') {
          // Then fetch the image from search API
          const titleQuery = data.data.metadata.full_book_name.split(' ').slice(0, 3).join(' ');
          const searchResponse = await fetch(`${API_BASE_URL}api/search/?s=${encodeURIComponent(titleQuery)}`);
          const searchData = await searchResponse.json();
          
          // Find matching book in search results
          const matchingBook = searchData.results.find((result: any) => 
            result.title.includes(data.data.metadata.full_book_name) ||
            result.link.includes(cleanSlug)
          );
          
          // Update book data with image
          setBook({
            ...data.data,
            image: matchingBook?.image || '/placeholder-book.jpg',
            book_link: matchingBook?.link || 'null'
          });
        } else {
          throw new Error(data.error || 'Failed to load book');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [book_slug]);

  const handleDownload = async (type: string) => {
    try {
      setDownloadingType(type);
      setError('');
      if (!book?.book_link) {
        throw new Error("Book link not available");
      }

      const response = await fetch(`${API_BASE_URL}api/download/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: book.book_link,
          type: type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Download failed");
      }

      // Get file as blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.metadata.full_book_name}.pdf`; // Friendly filename
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError(err instanceof Error ? err.message : "Download failed. Please try again.");
    } finally{
      setDownloadingType(null);
    }
  };


  

  // In BookDetail.tsx, update the handleBack function
const handleBack = () => {
  if (location.state?.fromGenres) {
    // Navigate back to genres with preserved state
    navigate(location.state.returnUrl || '/genres', {
      state: {
        preserveScroll: true
      }
    });
  } else if (location.state?.fromSearch) {
    navigate('/search', {
      state: {
        searchQuery: location.state.searchQuery,
        searchResults: location.state.searchResults
      }
    });
  } else {
    navigate(-1);
  }
};

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!book) return <div className="text-center py-8">Book not found</div>;


return (
  <div className="container mx-auto py-8 px-4">
    <Button variant="ghost" onClick={handleBack} className="mb-4">
      ← Back to Results
    </Button>

    <Card className="mb-8">
      <CardHeader className="flex flex-col md:flex-row gap-6">
        {book.image && (
          <div className="w-full md:w-1/3">
            <img
              src={getHighQualityImage(book.image)}
              alt={`${book.metadata.full_book_name} cover`}
              className="rounded-lg shadow-md w-full max-w-xs mx-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-book.jpg';
              }}
            />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{book.metadata.full_book_name}</h1>
          <p className="text-lg text-gray-600 mb-4">by {book.metadata.author_name}</p>
          
          {/* Complete Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Published Date</p>
              <p className="text-gray-700">{book.metadata.date_of_publication}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Genre</p>
              <p className="text-gray-700">{book.metadata.book_genre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Language</p>
              <p className="text-gray-700">{book.metadata.edition_language}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">File Sizes</p>
              <p className="text-gray-700">
                PDF: {book.metadata.pdf_file_size} | EPUB: {book.metadata.epub_file_size}
              </p>
            </div>
            {/* Additional metadata fields if they exist */}
            {book.metadata.isbn && (
              <div>
                <p className="text-sm text-gray-500">ISBN</p>
                <p className="text-gray-700">{book.metadata.isbn}</p>
              </div>
            )}
            {book.metadata.asin && (
              <div>
                <p className="text-sm text-gray-500">ASIN</p>
                <p className="text-gray-700">{book.metadata.asin}</p>
              </div>
            )}
            {book.metadata.series_detail && (
              <div>
                <p className="text-sm text-gray-500">Series</p>
                <p className="text-gray-700">{book.metadata.series_detail}</p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Section */}
        {book.summary && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {book.summary.replace(/([a-z])([A-Z])/g, '$1 $2')}
            </p>
          </div>
        )}

        {/* Description Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          {book.description.map((paragraph, index) => (
            <p key={index} className="text-gray-700 mb-4 whitespace-pre-line">
              {paragraph.replace(/([a-z])([A-Z])/g, '$1 $2')}
            </p>
          ))}
        </div>

        {/* Download Options */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Download Options</h2>
          <div className="flex flex-wrap gap-4">
            {book.download_options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleDownload(option.type)}
                className="min-w-[120px]"
                variant="outline"
                disabled={isDownloading}
              >
                <div className="flex items-center gap-2">
                {downloadingType === option.type ? (
                  <>
                    <svg 
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
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
                    Downloading...
                  </>
                ) : (
                  <>
                    <span>{option.type}</span>
                    <span className="text-xs opacity-75">
                      ({option.type === 'PDF' 
                        ? book.metadata.pdf_file_size 
                        : book.metadata.epub_file_size})
                  </span>
                  </>
                )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
}