import { supabase } from '../lib/supabase';

export async function getStorageUrl(path: string, forceRefresh: boolean = false): Promise<string> {
  try {
    // If it's already a full URL, add cache buster if needed
    if (path.startsWith('http')) {
      return forceRefresh ? `${path}?t=${Date.now()}` : path;
    }

    // Get public URL from storage
    const { data } = supabase.storage
      .from('designs')
      .getPublicUrl(path);

    const publicUrl = data?.publicUrl || path;
    return forceRefresh ? `${publicUrl}?t=${Date.now()}` : publicUrl;
  } catch (error) {
    console.error('Error getting storage URL:', error);
    return path;
  }
}

export async function refreshStorageUrl(path: string): Promise<string> {
  return getStorageUrl(path, true);
}

export function getStorageFilePath(url: string): string | null {
  try {
    // Handle direct storage paths
    if (!url.startsWith('http')) {
      return url;
    }

    // Extract path from Supabase storage URL
    const storageUrl = new URL(url);
    const pathParts = storageUrl.pathname.split('/');
    
    // Find the 'prints' directory in the path
    const printsIndex = pathParts.findIndex(part => part === 'prints');
    if (printsIndex === -1) return null;

    // Return everything after 'prints/'
    return pathParts.slice(printsIndex).join('/');
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return null;
  }
}