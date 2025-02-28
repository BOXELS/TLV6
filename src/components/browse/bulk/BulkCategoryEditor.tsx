import React, { useState } from 'react';
import { FolderPlus, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DesignFile } from '../../../types/database';
import CategorySelect from '../../upload/CategorySelect';
import { bulkAddCategories, bulkRemoveCategories } from '../../../utils/bulkOperations';

type BulkCategoryEditorProps = {
  selectedDesigns: DesignFile[];
  onUpdate: () => Promise<void>;
};

export default function BulkCategoryEditor({ selectedDesigns, onUpdate }: BulkCategoryEditorProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'add') {
        await bulkAddCategories(selectedDesigns, selectedCategories);
      } else {
        await bulkRemoveCategories(selectedDesigns, selectedCategories);
      }

      await onUpdate();
      setShowEditor(false);
      setSelectedCategories([]);
      toast.success(`Categories ${mode === 'add' ? 'added to' : 'removed from'} selected designs`);
    } catch (error) {
      console.error('Bulk category update error:', error);
      toast.error('Failed to update categories');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowEditor(!showEditor)}
        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
      >
        <FolderPlus className="w-4 h-4 mr-2" />
        Edit Categories
      </button>

      {showEditor && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-lg p-4 z-10">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('add')}
              disabled={isSubmitting}
              className={`flex items-center px-3 py-1 rounded-md text-sm ${
                mode === 'add' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </button>
            <button
              onClick={() => setMode('remove')}
              disabled={isSubmitting}
              className={`flex items-center px-3 py-1 rounded-md text-sm ${
                mode === 'remove' 
                  ? 'bg-red-100 text-red-700' 
                  : 'text-gray-700 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              <Minus className="w-4 h-4 mr-1" />
              Remove
            </button>
          </div>

          <CategorySelect
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            onCategoriesUpdate={setCategories}
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowEditor(false);
                setSelectedCategories([]);
              }}
              disabled={isSubmitting}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}