import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type DesignStats = {
  totalDesigns: number;
  totalCategories: number;
  totalKeywords: number;
  loading: boolean;
};

export function useDesignStats() {
  const [stats, setStats] = useState<DesignStats>({
    totalDesigns: 0,
    totalCategories: 0,
    totalKeywords: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: designCount },
          { count: categoryCount },
          { count: keywordCount },
        ] = await Promise.all([
          supabase.from('design_files').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true }),
          supabase.from('keywords').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          totalDesigns: designCount || 0,
          totalCategories: categoryCount || 0,
          totalKeywords: keywordCount || 0,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }

    fetchStats();
  }, []);

  return stats;
}