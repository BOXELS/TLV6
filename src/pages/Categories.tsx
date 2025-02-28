import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import CategoryForm from '../components/categories/CategoryForm';
import type { Category } from '../types/database';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          category_keyword_links(
            keywords(keyword)
          )
        `)
        .order('name');

      if (error) throw error;

      // Transform data to match expected format
      const transformedData = data?.map(category => ({
        ...category,
        keywords: category.category_keyword_links
          ?.map(link => link.keywords?.keyword)
          .filter(Boolean) || []
      }));

      setCategories(transformedData || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also remove it from all designs that use it.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete category (links will be deleted via cascade)
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Delete operation failed:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading categories...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Categories</h2>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </button>
        </div>

        {showNewForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">New Category</h3>
            <CategoryForm
              onSave={() => {
                setShowNewForm(false);
                loadCategories();
              }}
              onCancel={() => setShowNewForm(false)}
            />
          </div>
        )}

        {editingCategory && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Category</h3>
            <CategoryForm
              categoryId={editingCategory.id}
              initialName={editingCategory.name}
              initialKeywords={editingCategory.keywords || []}
              onSave={() => {
                setEditingCategory(null);
                loadCategories();
              }}
              onCancel={() => setEditingCategory(null)}
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm divide-y">
          {categories.map((category) => (
            <div key={category.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {category.name}
                  </h3>
                  {category.keywords && category.keywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {category.keywords.map((keyword, index) => (
                        <span
                          key={`${category.id}-${keyword}-${index}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    disabled={isDeleting}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}