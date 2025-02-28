import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useJaneStyles } from '../../hooks/useJaneStyles';
import toast from 'react-hot-toast';

type Style = {
  id: string;
  style_id: string;
  name: string;
  description: string;
};

export default function JaneStyles() {
  const { styles, loading, addStyle, updateStyle, deleteStyle } = useJaneStyles();
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStyle, setNewStyle] = useState({
    style_id: '',
    name: '',
    description: ''
  });

  const filteredStyles = styles.filter(style => 
    style.style_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    style.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    try {
      if (editingStyle) {
        const success = await updateStyle(editingStyle.id, {
          style_id: editingStyle.style_id,
          name: editingStyle.name,
          description: editingStyle.description
        });
        if (success) {
          toast.success('Style updated successfully');
          setEditingStyle(null);
        }
      } else {
        const success = await addStyle(
          newStyle.style_id,
          newStyle.name,
          newStyle.description
        );
        if (success) {
          toast.success('Style added successfully');
          setNewStyle({ style_id: '', name: '', description: '' });
        }
      }
    } catch (error) {
      toast.error('Failed to save style');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this style?')) return;

    try {
      const success = await deleteStyle(id);
      if (success) {
        toast.success('Style deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete style');
    }
  };

  if (loading) {
    return <div className="p-6">Loading styles...</div>;
  }

  return (
    <div className="p-6">
      {/* Add/Edit Form */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium mb-4">
          {editingStyle ? 'Edit Style' : 'Add New Style'}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style ID
              </label>
              <input
                type="text"
                value={editingStyle?.style_id || newStyle.style_id}
                onChange={(e) => {
                  if (editingStyle) {
                    setEditingStyle({ ...editingStyle, style_id: e.target.value });
                  } else {
                    setNewStyle({ ...newStyle, style_id: e.target.value });
                  }
                }}
                className="w-full rounded-md border-gray-300"
                placeholder="e.g., 6030"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={editingStyle?.name || newStyle.name}
                onChange={(e) => {
                  if (editingStyle) {
                    setEditingStyle({ ...editingStyle, name: e.target.value });
                  } else {
                    setNewStyle({ ...newStyle, name: e.target.value });
                  }
                }}
                className="w-full rounded-md border-gray-300"
                placeholder="e.g., Comfort Colors 6030"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Description
            </label>
            <textarea
              value={editingStyle?.description || newStyle.description}
              onChange={(e) => {
                if (editingStyle) {
                  setEditingStyle({ ...editingStyle, description: e.target.value });
                } else {
                  setNewStyle({ ...newStyle, description: e.target.value });
                }
              }}
              rows={4}
              className="w-full rounded-md border-gray-300"
              placeholder="Enter default product description..."
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingStyle(null);
              setNewStyle({ style_id: '', name: '', description: '' });
            }}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            {editingStyle ? 'Update Style' : 'Add Style'}
          </button>
        </div>
      </div>

      {/* Styles List */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search styles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-4">
        {filteredStyles.map((style) => (
          <div key={style.id} className="border rounded-lg">
            <div className="flex items-center justify-between p-4 bg-gray-50">
              <div>
                <h3 className="font-medium text-gray-900">{style.style_id}</h3>
                <p className="text-sm text-gray-500">{style.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingStyle(style)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(style.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {style.description && (
              <div className="p-4 text-sm text-gray-600">
                {style.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}