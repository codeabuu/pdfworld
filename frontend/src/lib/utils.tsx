import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { LibraryBig, Flame, BookText, BookOpen } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getHighQualityImage = (url: string | undefined): string => {
  if (!url) return '/placeholder-book.jpg';

  // if (url.includes('oceanofpdf.com')) {
  //   return url
  //     .replace('-150x225', '') // Remove thumbnail size
  //     .replace('-scaled', '');  // Remove scaled suffix
  // }

  return url;
  
};

export const renderLoadingSkeleton = (
  count: number,
  type: "book" | "genre" | "magazine"
) => (
  <div
    className={`grid gap-4 ${
      type === "book" || type === "magazine"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    }`}
  >
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} className="animate-pulse">
        <CardHeader className="p-0">
          {type !== "genre" && (
            <div className="aspect-[2/3] bg-gray-200 rounded-t-lg"></div>
          )}
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          {type === "book" && (
            <div className="h-8 mt-2 bg-gray-200 rounded"></div>
          )}
        </CardContent>
      </Card>
    ))}
  </div>
);

/**
 * Navigation items for the dashboard sidebar
 */
export const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LibraryBig },
  { name: "New Releases", path: "/dashboard/releases", icon: Flame },
  { name: "Genres", path: "/dashboard/genres", icon: BookText },
  { name: "Magazines & Newspapers", path: "/dashboard/magazines", icon: BookOpen },
];