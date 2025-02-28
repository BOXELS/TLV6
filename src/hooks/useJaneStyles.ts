import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Style = {
  id: string;
  style_id: string;
  name: string;
  description: string;
};

export function useJaneStyles() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStyles = async () => {
    try {
      const { data, error } = await supabase
        .from('jane_styles')
        .select('*')
        .order('style_id');

      if (error) throw error;
      setStyles(data || []);
    } catch (error) {
      console.error('Error loading styles:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStyle = async (style_id: string, name: string, description: string = '') => {
    try {
      const { error } = await supabase
        .from('jane_styles')
        .insert([{ style_id, name, description }]);

      if (error) throw error;
      await loadStyles();
      return true;
    } catch (error) {
      console.error('Error adding style:', error);
      return false;
    }
  };

  const updateStyle = async (id: string, updates: Partial<Style>) => {
    try {
      const { error } = await supabase
        .from('jane_styles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadStyles();
      return true;
    } catch (error) {
      console.error('Error updating style:', error);
      return false;
    }
  };

  const deleteStyle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jane_styles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadStyles();
      return true;
    } catch (error) {
      console.error('Error deleting style:', error);
      return false;
    }
  };

  useEffect(() => {
    loadStyles();
  }, []);

  return {
    styles,
    loading,
    addStyle,
    updateStyle,
    deleteStyle,
    refresh: loadStyles
  };
}