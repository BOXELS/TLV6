import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { DesignFile } from '../../types/database';

export default function RecentDesigns() {
  const [designs, setDesigns] = useState<DesignFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentDesigns();
  }, []);

  const loadRecentDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('design_files')
        .select('id, sku, web_file_url')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error('Error loading recent designs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Designs</h3>
      <div className="grid grid-cols-4 gap-4">
        {designs.map((design) => (
          <div key={design.id} className="text-center">
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
              <img
                src={design.web_file_url}
                alt={design.sku}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <p className="mt-1 text-sm text-gray-600">{design.sku}</p>
          </div>
        ))}
      </div>
    </div>
  );
}