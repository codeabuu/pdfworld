import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/";

export const searchBooks = async(query: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}api/search/`, {
            params: { s: query }
        });
        return response.data;
    } catch (error) {
        console.error("Error searching books:", error);
        throw error;
    }
};

export const getBookDetails = async (book_slug: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/book-detail/${book_slug}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching book details:", error);
    throw error;
  }
};

export const getNewReleases = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/new-releases/`);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching new releases:", error);
    throw error;
  }
};

export const getMagazines = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/magazines/`);

    return response.data;
  } catch (error) {
    console.error("Error fetching magazines:", error);
    throw error;
  }
};

export const getNewNovels = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/my-novels/`);

    return response.data;
  } catch (error) {
    console.error("Error fetching new novels:", error);
    throw error;
  }
};

export const getGenres = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/genres/`);
    if (response.status !== 200) {
      throw new Error("Network response was not ok");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching genres:", error);
    throw error;
  }
};

export const getGenreBooks = async (genreSlug: string, page: number = 1) => {
  // console.log(`API CALL: Fetching ${genreSlug} books, page ${page}`);
  try {
    const response = await axios.get(`${API_BASE_URL}api/genres/${genreSlug}/books/?page=${page}`);
    // console.log(`API RESPONSE: ${genreSlug} page ${page} - ${response.data.results.length} books`);
    if (response.status !== 200) throw new Error('Failed to fetch genre books');
    return response.data;
  } catch (error) {
    // console.error("Error fetching genre books:", error);
    throw error;
  }
};

export const getPopularGenres = async (): Promise<{
  source: string;
  count: number;
  results: Array<{
    name: string;
    slug: string;
    url: string;
    book_count: number;
  }>;
}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/genres/popular/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch popular genres:', error);
    throw error;
  }
};
