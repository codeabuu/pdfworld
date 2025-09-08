// genreImages.ts
export const genreImages: Record<string, string> = {
  // Fiction - corrected to match actual filename
  'Fiction': '/Fictionpng.png',
  'fiction': '/Fictionpng.png',

  // Romance
  'Romance': '/Romance.png',
  'romance': '/Romance.png',

  // Nonfiction - add specific mapping
  'Nonfiction': '/Nonfiction.png',
  'nonfiction': '/Nonfiction.png',
  'non-fiction': '/Nonfiction.png',

  'contemporary': '/Contemporary.png',
  'Contemporary': '/Contemporary.png',
  // Add more specific mappings for your popular genres
  'Mystery': '/Mystery.png',
  'mystery': '/Mystery.png',

  'Science Fiction': '/ScienceFiction.png',
  'science-fiction': '/ScienceFiction.png',
  'sci-fi': '/ScienceFiction.png',
  
  'Fantasy': '/Fantasy1.png',
  'fantasy': '/Fantasy1.png',

  // Default fallback
  'default': '/images/genres/default.jpg'
};

// Improved helper function to get genre image
export const getGenreImage = (genreName: string, genreSlug: string): string => {
  const normalizedSlug = genreSlug.toLowerCase().trim();
  const normalizedName = genreName.toLowerCase().trim();
  
  console.log('Looking for image for:', { genreName, normalizedName, genreSlug, normalizedSlug });
  
  // 1. Try exact match by normalized name
  if (genreImages[normalizedName]) {
    console.log('Found exact name match:', normalizedName);
    return genreImages[normalizedName];
  }
  
  // 2. Try exact match by normalized slug
  if (genreImages[normalizedSlug]) {
    console.log('Found exact slug match:', normalizedSlug);
    return genreImages[normalizedSlug];
  }
  
  // 3. Try to find the best partial match
  const genreKeys = Object.keys(genreImages);
  
  // Look for keys that are contained in the name or slug
  const containedMatch = genreKeys.find(key => 
    normalizedName.includes(key.toLowerCase()) ||
    normalizedSlug.includes(key.toLowerCase())
  );
  
  if (containedMatch) {
    console.log('Found contained match:', containedMatch);
    return genreImages[containedMatch];
  }
  
  // Look for name/slug contained in keys
  const reverseContainedMatch = genreKeys.find(key => 
    key.toLowerCase().includes(normalizedName) ||
    key.toLowerCase().includes(normalizedSlug)
  );
  
  if (reverseContainedMatch) {
    console.log('Found reverse contained match:', reverseContainedMatch);
    return genreImages[reverseContainedMatch];
  }
  
  console.log('No match found, using default');
  return genreImages.default;
};

// Fallback function remains the same
export const getFallbackGenreImage = (genreName: string): string => {
  const colors = [
    'bg-gradient-to-br from-blue-500 to-purple-600',
    'bg-gradient-to-br from-green-500 to-teal-600',
    'bg-gradient-to-br from-red-500 to-pink-600',
    'bg-gradient-to-br from-yellow-500 to-orange-600',
    'bg-gradient-to-br from-indigo-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-pink-600',
    'bg-gradient-to-br from-teal-500 to-green-600',
    'bg-gradient-to-br from-orange-500 to-red-600'
  ];
  
  const hash = genreName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % colors.length;
  
  return colors[colorIndex];
};