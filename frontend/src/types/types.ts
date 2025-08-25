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
  slug?: string;
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

// types.ts
export interface Book {
  title: string;
  link: string;
  image: string;
  author: string;
  date?: string;
}

export interface Genre {
  id: number;
  name: string;
  count: number;
  color?: string;
}

export interface Magazine {
  id: number;
  title: string;
  image: string;
  issue: string;
  date: string;
  category: string;
}

export interface SearchResult {
  title: string;
  author: string;
  link: string;
  image: string;
}

export interface LoadingState {
  newReleases: boolean;
  genres: boolean;
  magazines: boolean;
}