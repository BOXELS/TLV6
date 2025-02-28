// List of common words to exclude
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for',
  'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on',
  'that', 'the', 'to', 'was', 'were', 'will', 'with', 'or', 'but'
]);

export function generateKeywordsFromTitle(title: string): string[] {
  // Split title into words and clean them
  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/) // Split on whitespace
    .filter(word => 
      word.length > 1 && // Skip single letters
      !STOP_WORDS.has(word) // Skip stop words
    );
  
  // Remove duplicates
  return Array.from(new Set(words));
}