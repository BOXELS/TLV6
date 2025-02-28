import React from 'react';
import { X, Edit2, Save } from 'lucide-react';
import type { BulkUploadItem } from '../../types/upload';

type BulkUploadPreviewProps = {
  items: BulkUploadItem[];
  onItemUpdate: (index: number, item: BulkUploadItem) => void;
  onItemRemove: (index: number) => void;
  onSaveAll: () => void;
  loading: boolean;
  backgroundColor: 'white' | 'black';
};

export default function BulkUploadPreview({ 
  items, 
  onItemUpdate, 
  onItemRemove,
  onSaveAll,
  loading,
  backgroundColor
}: BulkUploadPreviewProps) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editValue, setEditValue] = React.useState('');

  const handleEdit = (index: number, title: string) => {
    setEditingIndex(index);
    setEditValue(title);
  };

  const handleSave = (index: number) => {
    onItemUpdate(index, {
      ...items[index],
      title: editValue
    });
    setEditingIndex(null);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Preview</h3>
        <button
          onClick={onSaveAll}
          disabled={loading || items.length === 0}
          className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save All'}
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`h-16 w-16 rounded ${backgroundColor === 'black' ? 'bg-black' : 'bg-gray-100'}`}>
                    <img
                      src={URL.createObjectURL(item.file)}
                      alt={item.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{item.title}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{item.sku}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {editingIndex === index ? (
                      <button
                        onClick={() => handleSave(index)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(index, item.title)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onItemRemove(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}