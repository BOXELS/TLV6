import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type VariantGroupItem = {
  id: string;
  variant_id: string;
  custom_label: string;
  abbreviation: string;
  sort_order: number;
};

type VariantGroup = {
  id: string;
  name: string;
  items: VariantGroupItem[];
};

export function useJaneVariantGroups() {
  const [groups, setGroups] = useState<VariantGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('jane_primary_variant_groups')
        .select(`
          id,
          name,
          items:jane_primary_variant_group_items(
            id,
            variant_id,
            custom_label,
            abbreviation,
            sort_order
          )
        `)
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading variant groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return { groups, loading };
}