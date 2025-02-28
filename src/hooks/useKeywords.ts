import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Keyword = {
  id: string;
  keyword: string;
  created_at: string;
  usage_count?: number;
};

export function useKeywords() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);

  const loadKeywords = async () => {
    try {
      const { data, error } = await supabase
        .from('keywords')
        .select(`
          *,
          design_keyword_links(count),
          category_keyword_links(count)
        `)
        .order('keyword');

      if (error) throw error;

      // Calculate usage count
      const keywordsWithUsage = data.map(kw => ({
        ...kw,
        usage_count: (
          (kw.design_keyword_links?.[0]?.count || 0) +
          (kw.category_keyword_links?.[0]?.count || 0)
        )
      }));

      setKeywords(keywordsWithUsage);
    } catch (error) {
      console.error('Error loading keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeywords();
  }, []);

  const addKeyword = async (keyword: string) => {
    const { error } = await supabase
      .from('keywords')
      .insert([{ keyword }]);

    if (error) throw error;
    await loadKeywords();
  };

  const updateKeyword = async (id: string, keyword: string) => {
    const { error } = await supabase
      .from('keywords')
      .update({ keyword })
      .eq('id', id);

    if (error) throw error;
    await loadKeywords();
  };

  const deleteKeyword = async (id: string) => {
    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await loadKeywords();
  };

  return {
    keywords,
    loading,
    addKeyword,
    updateKeyword,
    deleteKeyword,
  };
}