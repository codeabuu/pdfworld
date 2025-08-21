// types.ts
export interface Genre {
  name: string;
  slug: string;
  url: string;
  book_count: number;
}

export interface GenreBook {
  title: string;
  link: string;
  image: string;
  author: string;
  date?: string;
  genre?: string;
  description?: string;
}

export interface GenreBooksProps {
  genre: Genre;
  books: GenreBook[];
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onBookSelect: (book: GenreBook) => void;
  onBackToGenres: () => void;
}