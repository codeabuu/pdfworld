import { useState, useEffect } from "react";
import { searchBooks } from "@/lib/api";

export function useSearch(initialQuery: string = "") {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query) fetchResults(query);
  }, [query]);

  const fetchResults = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      setError("");
      const data = await searchBooks(searchQuery);
      setResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Failed to fetch results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return { query, setQuery, results, isLoading, error };
}
