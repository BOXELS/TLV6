import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DesignFile } from '../../../types/database';

type BulkMockupOrderEditorProps = {
  selectedDesigns: DesignFile[];
  onUpdate: () => Promise<void>;
};

export default function BulkMockupOrderEditor({ selectedDesigns, onUpdate }: BulkMockupOrderEditorProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/edit-mockup-order', { state: { designs: selectedDesigns } })}
      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
    >
      <GripVertical className="w-4 h-4 mr-2" />
      Edit Mockup Order
    </button>
  );
}