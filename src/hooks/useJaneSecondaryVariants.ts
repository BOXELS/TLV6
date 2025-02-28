import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type JaneSecondaryVariant = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  custom_label?: string;
  abbreviation?: string;
};

export function useJaneSecondaryVariants() {
  const [variants, setVariants] = useState<JaneSecondaryVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('jane_secondary_variants')
        .select('*')
        .order('level, sort_order, name');

      if (error) {
        console.error('Supabase error loading secondary variants:', error);
        toast.error('Failed to load size variants. Please try again.');
        return;
      }

      setVariants(data || []);
    } catch (error) {
      console.error('Error loading secondary variants:', error);
      toast.error('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const getMainCategory = () => 
    variants.find(v => v.level === 1);

  const getSubCategories = () => 
    variants.filter(v => v.level === 2).sort((a, b) => {
      // First sort by sort_order
      if (a.sort_order !== undefined && b.sort_order !== undefined) {
        return a.sort_order - b.sort_order;
      }
      // Fall back to name sorting if sort_order is not available
      return a.name.localeCompare(b.name);
    });

  return {
    variants,
    loading,
    getMainCategory,
    getSubCategories
  };
}