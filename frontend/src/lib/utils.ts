import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getHighQualityImage = (url: string | undefined): string => {
  if (!url) return '/placeholder-book.jpg';
  
  if (url.includes('oceanofpdf.com')) {
    return url
      .replace('-150x225', '') // Remove thumbnail size
      .replace('-scaled', '');  // Remove scaled suffix
  }
  
  return url;
};