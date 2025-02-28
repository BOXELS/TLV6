import React from 'react';
import { useDesignStats } from '../../hooks/useDesignStats';
import { FileBox, FolderOpen, Tags } from 'lucide-react';

export default function DesignStats() {
  const { totalDesigns, totalCategories, totalKeywords, loading } = useDesignStats();

  if (loading) {
    return <div className="text-sm text-gray-500">Loading stats...</div>;
  }

  return (
    <div className="flex items-center gap-6 text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <FileBox className="w-4 h-4" />
        <span>{totalDesigns} designs</span>
      </div>
      <div className="flex items-center gap-1">
        <FolderOpen className="w-4 h-4" />
        <span>{totalCategories} categories</span>
      </div>
      <div className="flex items-center gap-1">
        <Tags className="w-4 h-4" />
        <span>{totalKeywords} keywords</span>
      </div>
    </div>
  );
}