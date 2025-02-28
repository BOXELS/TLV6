import { supabase } from '../lib/supabase';

export async function getNextSkuId(): Promise<string> {
  try {
    const { data: maxId, error } = await supabase
      .from('design_files')
      .select('sku')
      .ilike('sku', '%-%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error getting next SKU ID:', error);
      return '3001';
    }

    // Handle case when no designs exist yet
    if (!maxId) {
      return '3001';
    }

    // Get highest SKU number
    const match = maxId.sku.match(/^(\d+)-/);
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return nextNumber.toString();
    }
    
    return '3001'; // Default starting number
  } catch (error) {
    console.error('Error getting next SKU ID:', error);
    return '3001';
  }
}

export function generateAcronymFromFilename(filename: string): string {
  // Remove file extension and clean the string
  const name = filename
    .substring(0, filename.lastIndexOf('.'))
    .replace(/[^a-zA-Z\s]/g, ' ') // Replace special chars with spaces
    .trim();
  
  // Split into words
  const words = name.split(/\s+/).filter(Boolean);
  
  if (words.length === 0) return '';
  
  // Take first letter of each word (up to 6 words)
  return words
    .slice(0, 6)
    .map(word => word[0].toUpperCase())
    .join('');
}