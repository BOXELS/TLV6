import React from 'react';
import { Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DesignFile } from '../../../types/database';

type BulkTitleEditorProps = {
  selectedDesigns: DesignFile[];
};

export default function BulkTitleEditor({ selectedDesigns }: BulkTitleEditorProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/edit-titles', { state: { designs: selectedDesigns } })}
      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
    >
      <Edit2 className="w-4 h-4 mr-2" />
      Edit Titles
    </button>
  );
}