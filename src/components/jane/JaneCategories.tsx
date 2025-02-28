import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
};

export default function JaneCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    parent_id: null as string | null,
    level: 1
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('jane_categories')
        .select('*')
        .order('level, name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('jane_categories')
          .update({ name: editingCategory.name })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('jane_categories')
          .insert([newCategory]);

        if (error) throw error;
        toast.success('Category added successfully');
        setNewCategory({ name: '', parent_id: null, level: 1 });
      }

      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('jane_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const getParentOptions = (level: number) => {
    if (level === 1) return [];
    return categories.filter(c => c.level === level - 1);
  };

  if (loading) {
    return <div className="p-6">Loading categories...</div>;
  }

  return (
    <div className="p-6">
      {/* Add/Edit Form */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium mb-4">
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={editingCategory?.level || newCategory.level}
              onChange={(e) => {
                if (editingCategory) {
                  setEditingCategory({ ...editingCategory, level: parseInt(e.target.value) });
                } else {
                  setNewCategory({ ...newCategory, level: parseInt(e.target.value) });
                }
              }}
              className="w-full rounded-md border-gray-300"
              disabled={!!editingCategory}
            >
              <option value={1}>Main Category</option>
              <option value={2}>Sub Category</option>
              <option value={3}>Type</option>
            </select>
          </div>
          {(editingCategory?.level || newCategory.level) > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
              <select
                value={editingCategory?.parent_id || newCategory.parent_id || ''}
                onChange={(e) => {
                  if (editingCategory) {
                    setEditingCategory({ ...editingCategory, parent_id: e.target.value });
                  } else {
                    setNewCategory({ ...newCategory, parent_id: e.target.value });
                  }
                }}
                className="w-full rounded-md border-gray-300"
                disabled={!!editingCategory}
              >
                <option value="">Select Parent</option>
                {getParentOptions(editingCategory?.level || newCategory.level).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={editingCategory?.name || newCategory.name}
              onChange={(e) => {
                if (editingCategory) {
                  setEditingCategory({ ...editingCategory, name: e.target.value });
                } else {
                  setNewCategory({ ...newCategory, name: e.target.value });
                }
              }}
              className="w-full rounded-md border-gray-300"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingCategory(null);
              setNewCategory({ name: '', parent_id: null, level: 1 });
            }}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            {editingCategory ? 'Update' : 'Add'} Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {categories
          .filter(c => c.level === 1)
          .map(mainCat => (
            <div key={mainCat.id} className="border rounded-lg">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
                <div className="font-medium">{mainCat.name}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingCategory(mainCat)}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(mainCat.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Sub Categories */}
              <div className="p-4">
                {categories
                  .filter(sub => sub.parent_id === mainCat.id)
                  .map(subCat => (
                    <div key={subCat.id} className="ml-4 mb-4 last:mb-0">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center">
                          <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                          {subCat.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingCategory(subCat)}
                            className="p-1 text-gray-500 hover:text-indigo-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(subCat.id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {/* Types */}
                      {categories
                        .filter(type => type.parent_id === subCat.id)
                        .map(type => (
                          <div key={type.id} className="ml-8 flex items-center justify-between py-2">
                            <div className="flex items-center">
                              <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                              {type.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingCategory(type)}
                                className="p-1 text-gray-500 hover:text-indigo-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(type.id)}
                                className="p-1 text-gray-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}