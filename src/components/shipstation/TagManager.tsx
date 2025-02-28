import React, { useState, useEffect } from 'react';
import { Tag, Plus, Minus } from 'lucide-react';
import { fetchShipstationTags, addTagToOrders, removeTagFromOrders } from '../../utils/shipstationApi';
import type { ShipstationCredentials } from '../../types/shipstation';
import toast from 'react-hot-toast';

type TagManagerProps = {
  credentials: ShipstationCredentials;
  selectedOrderIds: string[];
  onTagsUpdated: () => void;
};

export default function TagManager({ credentials, selectedOrderIds, onTagsUpdated }: TagManagerProps) {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Array<{ tagId: number; name: string; color: string }>>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [mode, setMode] = useState<'add' | 'remove'>('add');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const fetchedTags = await fetchShipstationTags(credentials);
      setTags(fetchedTags);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Apply Selected Tag to Orders
const handleApplyTag = async () => {
  if (!selectedTag || selectedOrderIds.length === 0) {
    toast.error(`Please select a tag and at least one order to ${mode === 'add' ? 'add' : 'remove'}`);
    return;
  }

  console.log(`${mode === 'add' ? 'Adding' : 'Removing'} tag:`, selectedTag, 'to/from orders:', selectedOrderIds);
  setLoading(true);
  try {
    if (mode === 'add') {
      await addTagToOrders(credentials, selectedOrderIds, Number(selectedTag));
      console.log('Tag added successfully');
      toast.success('Tag added successfully');
    } else {
      await removeTagFromOrders(credentials, selectedOrderIds, Number(selectedTag));
      console.log('Tag removed successfully');
      toast.success('Tag removed successfully');
    }
    
    await loadTags(); // ✅ Refresh the tag list after applying
    onTagsUpdated(); // ✅ Notify parent component
    setSelectedTag(''); // Reset selected tag after applying
  } catch (error) {
    console.error('Error applying tag:', error);
    toast.error(error instanceof Error ? error.message : `Failed to ${mode === 'add' ? 'add' : 'remove'} tag`);
  } finally {
    setLoading(false);
  }
};

  if (selectedOrderIds.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex rounded-md shadow-sm">
        <button
          onClick={() => setMode('add')}
          className={`flex items-center px-3 py-1.5 rounded-l-md border text-sm font-medium ${
            mode === 'add'
              ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </button>
        <button
          onClick={() => setMode('remove')}
          className={`flex items-center px-3 py-1.5 rounded-r-md border-t border-r border-b -ml-px text-sm font-medium ${
            mode === 'remove'
              ? 'bg-red-50 text-red-600 border-red-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Minus className="w-4 h-4 mr-1" />
          Remove
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-gray-500" />
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          disabled={loading || tags.length === 0}
        >
          {loading ? (
            <option value="">Loading tags...</option>
          ) : tags.length > 0 ? (
            <>
              <option value="">Select a tag...</option>
              {tags.map((tag) => (
                <option key={tag.tagId} value={String(tag.tagId)}>
                  {tag.name}
                </option>
              ))}
            </>
          ) : (
            <option value="">No tags available</option>
          )}
        </select>
        <button
          onClick={handleApplyTag}
          disabled={loading || !selectedTag}
          className={`px-3 py-1 text-sm text-white rounded-md disabled:opacity-50 ${
            mode === 'add'
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {loading ? `${mode === 'add' ? 'Adding' : 'Removing'}...` : mode === 'add' ? 'Add Tag' : 'Remove Tag'}
        </button>
      </div>
    </div>
  );
}