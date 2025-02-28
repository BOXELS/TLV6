import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useKeywords } from '../../hooks/useKeywords';
import toast from 'react-hot-toast';

export default function AddKeyword() {
  const [showForm, setShowForm] = useState(false);
  const [keyword, setKeyword] = useState('');
  const { addKeyword } = useKeywords();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim()) {
      toast.error('Please enter a keyword');
      return;
    }

    try {
      await addKeyword(keyword.trim());
      setKeyword('');
      setShowForm(false);
      toast.success('Keyword added successfully');
    } catch (error) {
      toast.error('Failed to add keyword');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Keyword
      </button>

      {showForm && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg p-4 z-10">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                New Keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter keyword"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Add Keyword
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}