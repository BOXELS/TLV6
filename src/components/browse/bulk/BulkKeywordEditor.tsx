import React, { useState } from 'react';
import { Tag, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DesignFile } from '../../../types/database';
import KeywordInput from '../../upload/KeywordInput';
import { bulkAddKeywords, bulkRemoveKeywords } from '../../../utils/bulkOperations';

type BulkKeywordEditorProps = {
  selectedDesigns: DesignFile[];
  onUpdate: () => Promise<void>;
};

export default function BulkKeywordEditor({ selectedDesigns, onUpdate }: BulkKeywordEditorProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (keywords.length === 0) {
      toast.error('Please enter at least one keyword');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'add') {
        await bulkAddKeywords(selectedDesigns, keywords);
      } else {
        await bulkRemoveKeywords(selectedDesigns, keywords);
      }

      await onUpdate();
      setShowEditor(false);
      setKeywords([]);
      toast.success(`Keywords ${mode === 'add' ? 'added to' : 'removed from'} selected designs`);
    } catch (error) {
      console.error('Bulk keyword update error:', error);
      toast.error('Failed to update keywords');
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
        <Tag className="w-4 h-4 mr-2" />
        Edit Keywords
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

          <KeywordInput
            keywords={keywords}
            onKeywordsChange={setKeywords}
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowEditor(false);
                setKeywords([]);
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