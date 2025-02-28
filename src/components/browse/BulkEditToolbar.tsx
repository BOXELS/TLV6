import React from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import type { DesignFile } from '../../types/database';
import BulkTitleEditor from './bulk/BulkTitleEditor';
import BulkKeywordEditor from './bulk/BulkKeywordEditor';
import BulkCategoryEditor from './bulk/BulkCategoryEditor';
import BulkMockupGenerator from './bulk/BulkMockupGenerator';
import BulkImageUpload from './bulk/BulkImageUpload';
import BulkMockupOrderEditor from './bulk/BulkMockupOrderEditor';

type BulkEditToolbarProps = {
  selectedDesigns: DesignFile[];
  onUpdate: () => Promise<void>;
  onClearSelection: () => void;
};

export default function BulkEditToolbar({ 
  selectedDesigns, 
  onUpdate,
  onClearSelection 
}: BulkEditToolbarProps) {

  if (selectedDesigns.length === 0) return null;


  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          {selectedDesigns.length} designs selected
        </h3>
        <button
          onClick={onClearSelection}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear selection
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <BulkTitleEditor
          selectedDesigns={selectedDesigns}
          onUpdate={onUpdate}
          onUpdate={onUpdate}
        />
        
        <BulkMockupOrderEditor
          selectedDesigns={selectedDesigns}
          onUpdate={onUpdate}
        />
        
        <BulkMockupGenerator
          selectedDesigns={selectedDesigns}
          onUpdate={onUpdate}
        />
        
        <BulkImageUpload
          selectedDesigns={selectedDesigns}
          onUpdate={onUpdate}
        />
        
        <BulkKeywordEditor 
          selectedDesigns={selectedDesigns}
          onUpdate={onUpdate}
        />
        
        <BulkCategoryEditor
          selectedDesigns={selectedDesigns}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
}