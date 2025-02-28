import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type TitleAppend = {
  id: string;
  text: string;
  is_default: boolean;
  sort_order: number;
};

export function useJaneTitleAppends() {
  const [appends, setAppends] = useState<TitleAppend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppends();
  }, []);

  const loadAppends = async () => {
    try {
      const { data, error } = await supabase
        .from('jane_title_appends')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setAppends(data || []);
    } catch (error) {
      console.error('Error loading title appends:', error);
      toast.error('Failed to load title appends');
    } finally {
      setLoading(false);
    }
  };

  return {
    appends,
    loading,
    refresh: loadAppends
  };
}