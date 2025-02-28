import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Tag } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type ClothingStyle = {
  id: string;
  style_id: string;
  title: string;
  keywords: string[];
  created_at: string;
  updated_at: string;
};

export default function ClothingStyles() {
  const [styles, setStyles] = useState<ClothingStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStyle, setEditingStyle] = useState<ClothingStyle | null>(null);
  const [formData, setFormData] = useState({
    style_id: '',
    title: '',
    keywordInput: '',
    keywords: [] as string[]
  });

  useEffect(() => {
    loadStyles();
  }, []);

  const loadStyles = async () => {
    try {
      const { data, error } = await supabase
        .from('clothing_styles')
        .select('*')
        .order('style_id');

      if (error) throw error;
      setStyles(data || []);
    } catch (error) {
      console.error('Error loading styles:', error);
      toast.error('Failed to load styles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    if (!formData.keywordInput.trim()) return;
    if (!formData.keywords.includes(formData.keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, formData.keywordInput.trim()],
        keywordInput: ''
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.style_id || !formData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingStyle) {
        const { error } = await supabase
          .from('clothing_styles')
          .update({
            style_id: formData.style_id,
            title: formData.title,
            keywords: formData.keywords
          })
          .eq('id', editingStyle.id);

        if (error) throw error;
        toast.success('Style updated successfully');
      } else {
        const { error } = await supabase
          .from('clothing_styles')
          .insert({
            style_id: formData.style_id,
            title: formData.title,
            keywords: formData.keywords
          });

        if (error) throw error;
        toast.success('Style added successfully');
      }

      setShowAddForm(false);
      setEditingStyle(null);
      setFormData({
        style_id: '',
        title: '',
        keywordInput: '',
        keywords: []
      });
      loadStyles();
    } catch (error) {
      console.error('Error saving style:', error);
      toast.error('Failed to save style');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this style? This will affect any mockup templates using this style.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clothing_styles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Style deleted successfully');
      loadStyles();
    } catch (error) {
      console.error('Error deleting style:', error);
      toast.error('Failed to delete style');
    }
  };

  const handleEdit = (style: ClothingStyle) => {
    setEditingStyle(style);
    setFormData({
      style_id: style.style_id,
      title: style.title,
      keywordInput: '',
      keywords: style.keywords || []
    });
    setShowAddForm(true);
  };

  const filteredStyles = styles.filter(style =>
    style.style_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    style.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Clothing Styles</h2>
            <p className="mt-1 text-sm text-gray-500">Manage clothing style information and metadata</p>
          </div>
          <button
            onClick={() => {
              setEditingStyle(null);
              setFormData({
                style_id: '',
                title: '',
                keywordInput: '',
                keywords: []
              });
              setShowAddForm(true);
            }}
            className="flex items-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Style
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search styles..."
              className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">
                {editingStyle ? 'Edit Style' : 'Add New Style'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Style ID *
                  </label>
                  <input
                    type="text"
                    value={formData.style_id}
                    onChange={(e) => setFormData({ ...formData, style_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Keywords
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      value={formData.keywordInput}
                      onChange={(e) => setFormData({ ...formData, keywordInput: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Add keyword"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            keywords: formData.keywords.filter((_, i) => i !== index)
                          })}
                          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingStyle(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {editingStyle ? 'Update Style' : 'Add Style'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Styles List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Style ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keywords
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStyles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No styles found
                  </td>
                </tr>
              ) : (
                filteredStyles.map((style) => (
                  <tr key={style.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {style.style_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {style.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {style.keywords?.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(style.updated_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(style)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(style.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}