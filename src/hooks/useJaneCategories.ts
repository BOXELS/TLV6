import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type JaneCategory = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
};

export function useJaneCategories() {
  const [categories, setCategories] = useState<JaneCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('jane_categories')
        .select('*')
        .order('level, name');

      if (error) {
        console.error('Supabase error loading categories:', error);
        toast.error('Failed to load categories. Please try again.');
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading Jane categories:', error);
      toast.error('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const getMainCategories = () => 
    categories.filter(c => c.level === 1);

  const getSubCategories = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId && c.level === 2);

  const getTypes = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId && c.level === 3);

  return {
    categories,
    loading,
    getMainCategories,
    getSubCategories,
    getTypes
  };
}