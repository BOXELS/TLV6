import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useNextSkuId() {
  const [nextId, setNextId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNextId();
  }, []);

  const loadNextId = async () => {
    try {
      const { data: maxId } = await supabase
        .from('design_files')
        .select('sku')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (maxId) {
        const match = maxId.sku.match(/^(\d+)-/);
        if (match) {
          const nextNumber = parseInt(match[1]) + 1;
          setNextId(nextNumber.toString());
          return;
        }
      }
      
      // Default starting number if no designs exist
      setNextId('3001');
    } catch (error) {
      console.error('Error loading next SKU ID:', error);
      setNextId('3001'); // Fallback to default
    } finally {
      setLoading(false);
    }
  };

  return { nextId, loading };
}