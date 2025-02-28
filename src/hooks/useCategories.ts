import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Category } from '../types/database';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setError(null);
    try {
      // Add retry logic for network issues
      let retries = 3;
      let error;
      
      while (retries > 0) {
        try {
          const { data, error: queryError } = await supabase
            .from('categories')
            .select('*')
            .order('name');

          if (queryError) throw queryError;
          setCategories(data || []);
          return;
        } catch (e) {
          error = e;
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
          }
        }
      }

      // If we get here, all retries failed
      throw error;
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
      toast.error('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { 
    categories, 
    loading, 
    error,
    loadCategories 
  };
}