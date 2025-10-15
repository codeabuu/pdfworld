import { memo, useCallback } from "react";
import Header from "./Header";

interface CachedHeaderProps {
  onSearch: (results: any[]) => void;
}

const CachedHeader = memo(({ onSearch }: CachedHeaderProps) => {
  // Memoize the onSearch callback to prevent unnecessary re-renders
  const memoizedOnSearch = useCallback((results: any[]) => {
    onSearch(results);
  }, [onSearch]);

  return <Header onSearch={memoizedOnSearch} />;
});

CachedHeader.displayName = "CachedHeader";

export default CachedHeader;