import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type JanePrimaryVariant = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
};

export function useJanePrimaryVariants() {
  const [variants, setVariants] = useState<JanePrimaryVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('jane_primary_variants')
        .select('*')
        .order('level, name');

      if (error) {
        console.error('Supabase error loading primary variants:', error);
        toast.error('Failed to load color variants. Please try again.');
        return;
      }

      setVariants(data || []);
    } catch (error) {
      console.error('Error loading primary variants:', error);
      toast.error('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const getMainCategory = () => 
    variants.find(v => v.level === 1);

  const getSubCategories = () => 
    variants.filter(v => v.level === 2);

  return {
    variants,
    loading,
    getMainCategory,
    getSubCategories
  };
}