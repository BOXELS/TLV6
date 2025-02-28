import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type Variant = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
};

export default function JanePrimaryVariants() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [newVariant, setNewVariant] = useState({
    name: '',
    parent_id: null as string | null,
    level: 1
  });

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('jane_primary_variants')
        .select('*')
        .order('level, name');

      if (error) throw error;
      setVariants(data || []);
    } catch (error) {
      console.error('Error loading variants:', error);
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingVariant) {
        const { error } = await supabase
          .from('jane_primary_variants')
          .update({ name: editingVariant.name })
          .eq('id', editingVariant.id);

        if (error) throw error;
        toast.success('Variant updated successfully');
      } else {
        const { error } = await supabase
          .from('jane_primary_variants')
          .insert([newVariant]);

        if (error) throw error;
        toast.success('Variant added successfully');
        setNewVariant({ name: '', parent_id: null, level: 1 });
      }

      setEditingVariant(null);
      loadVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast.error('Failed to save variant');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;

    try {
      const { error } = await supabase
        .from('jane_primary_variants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Variant deleted successfully');
      loadVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error('Failed to delete variant');
    }
  };

  if (loading) {
    return <div className="p-6">Loading variants...</div>;
  }

  const mainVariant = variants.find(v => v.level === 1);
  const subVariants = variants.filter(v => v.level === 2);

  return (
    <div className="p-6">
      {/* Add/Edit Form */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium mb-4">
          {editingVariant ? 'Edit Variant' : 'Add New Variant'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={editingVariant?.level || newVariant.level}
              onChange={(e) => {
                if (editingVariant) {
                  setEditingVariant({ ...editingVariant, level: parseInt(e.target.value) });
                } else {
                  setNewVariant({ ...newVariant, level: parseInt(e.target.value) });
                }
              }}
              className="w-full rounded-md border-gray-300"
              disabled={!!editingVariant}
            >
              <option value={1}>Primary</option>
              <option value={2}>Sub Variant</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={editingVariant?.name || newVariant.name}
              onChange={(e) => {
                if (editingVariant) {
                  setEditingVariant({ ...editingVariant, name: e.target.value });
                } else {
                  setNewVariant({ ...newVariant, name: e.target.value });
                }
              }}
              className="w-full rounded-md border-gray-300"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingVariant(null);
              setNewVariant({ name: '', parent_id: null, level: 1 });
            }}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            {editingVariant ? 'Update' : 'Add'} Variant
          </button>
        </div>
      </div>

      {/* Variants List */}
      {mainVariant && (
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
            <div className="font-medium">{mainVariant.name}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingVariant(mainVariant)}
                className="p-1 text-gray-500 hover:text-indigo-600"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(mainVariant.id)}
                className="p-1 text-gray-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4">
            {subVariants.map(variant => (
              <div key={variant.id} className="ml-4 flex items-center justify-between py-2">
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                  {variant.name}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingVariant(variant)}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(variant.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}