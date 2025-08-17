import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/";

export const searchBooks = async(query: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/search/`, {
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