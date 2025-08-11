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