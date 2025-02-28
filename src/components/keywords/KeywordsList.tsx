import React, { useState } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { useKeywords } from '../../hooks/useKeywords';
import toast from 'react-hot-toast';

export default function KeywordsList() {
  const { keywords, loading, updateKeyword, deleteKeyword } = useKeywords();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredKeywords = keywords.filter(keyword =>
    keyword.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string, keyword: string) => {
    setEditingId(id);
    setEditValue(keyword);
  };

  const handleSave = async (id: string) => {
    try {
      await updateKeyword(id, editValue);
      setEditingId(null);
      toast.success('Keyword updated successfully');
    } catch (error) {
      toast.error('Failed to update keyword');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this keyword?')) return;
    
    try {
      await deleteKeyword(id);
      toast.success('Keyword deleted successfully');
    } catch (error) {
      toast.error('Failed to delete keyword');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading keywords...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Keyword
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredKeywords.map((keyword) => (
              <tr key={keyword.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === keyword.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{keyword.keyword}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {keyword.usage_count || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {new Date(keyword.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === keyword.id ? (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleSave(keyword.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(keyword.id, keyword.keyword)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(keyword.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}