import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useJanePrimaryVariants } from '../../hooks/useJanePrimaryVariants';

type VariantGroup = {
  id: string;
  name: string;
  items: VariantGroupItem[];
};

type VariantGroupItem = {
  id: string;
  variant_id: string;
  custom_label: string;
  abbreviation: string;
  sort_order: number;
};

export default function JaneVariantGroups() {
  const [groups, setGroups] = useState<VariantGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGroup, setEditingGroup] = useState<VariantGroup | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '' });
  const { variants, getMainCategory, getSubCategories } = useJanePrimaryVariants();

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('jane_primary_variant_groups')
        .select(`
          id,
          name,
          items:jane_primary_variant_group_items(
            id,
            variant_id,
            custom_label,
            abbreviation,
            sort_order
          )
        `)
        .order('name');

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);
    } catch (error) {
      console.error('Error loading variant groups:', error);
      toast.error('Failed to load variant groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingGroup) {
        const { error: groupError } = await supabase
          .from('jane_primary_variant_groups')
          .update({ name: editingGroup.name })
          .eq('id', editingGroup.id);

        if (groupError) throw groupError;

        // Delete all existing items first
        await supabase
          .from('jane_primary_variant_group_items')
          .delete()
          .eq('group_id', editingGroup.id);

        // Wait a moment to ensure delete completes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Insert items one by one to avoid conflicts
        const { error: itemsError } = await supabase
          .from('jane_primary_variant_group_items')
          .insert(
            editingGroup.items.map((item, index) => ({
              group_id: editingGroup.id,
              variant_id: item.variant_id,
              custom_label: item.custom_label,
              abbreviation: item.abbreviation,
              sort_order: index
            }))
          );

        if (itemsError) throw itemsError;

        toast.success('Group updated successfully');
      } else {
        // Create new group
        const { data: group, error: groupError } = await supabase
          .from('jane_primary_variant_groups')
          .insert([{ name: newGroup.name }])
          .select()
          .single();

        if (groupError) throw groupError;

        toast.success('Group created successfully');
        setNewGroup({ name: '' });
      }

      setEditingGroup(null);
      loadGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Failed to save group');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;

    try {
      const { error } = await supabase
        .from('jane_primary_variant_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Group deleted successfully');
      loadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  if (loading) {
    return <div className="p-6">Loading variant groups...</div>;
  }

  return (
    <div className="p-6">
      {/* Add/Edit Form */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium mb-4">
          {editingGroup ? 'Edit Variant Group' : 'Add New Variant Group'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={editingGroup?.name || newGroup.name}
              onChange={(e) => {
                if (editingGroup) {
                  setEditingGroup({ ...editingGroup, name: e.target.value });
                } else {
                  setNewGroup({ name: e.target.value });
                }
              }}
              className="w-full rounded-md border-gray-300"
              placeholder="e.g., BC3001 Light Neutrals"
            />
          </div>

          {editingGroup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variants
              </label>
              <div className="space-y-2">
                {editingGroup.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-4 gap-2">
                    <select
                      value={item.variant_id}
                      onChange={(e) => {
                        const items = [...editingGroup.items];
                        items[index] = { ...items[index], variant_id: e.target.value };
                        setEditingGroup({ ...editingGroup, items });
                      }}
                      className="rounded-md border-gray-300"
                    >
                      <option value="">Select Variant</option>
                      {getSubCategories().map(variant => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={item.custom_label}
                      onChange={(e) => {
                        const items = [...editingGroup.items];
                        items[index] = { ...items[index], custom_label: e.target.value };
                        setEditingGroup({ ...editingGroup, items });
                      }}
                      placeholder="Custom Label"
                      className="rounded-md border-gray-300"
                    />
                    <input
                      type="text"
                      value={item.abbreviation}
                      onChange={(e) => {
                        const items = [...editingGroup.items];
                        items[index] = { ...items[index], abbreviation: e.target.value };
                        setEditingGroup({ ...editingGroup, items });
                      }}
                      placeholder="Abbreviation"
                      className="rounded-md border-gray-300"
                    />
                    <button
                      onClick={() => {
                        const items = editingGroup.items.filter((_, i) => i !== index);
                        setEditingGroup({ ...editingGroup, items });
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const items = [...editingGroup.items, {
                      id: crypto.randomUUID(),
                      variant_id: '',
                      custom_label: '',
                      abbreviation: '',
                      sort_order: editingGroup.items.length
                    }];
                    setEditingGroup({ ...editingGroup, items });
                  }}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Variant
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingGroup(null);
              setNewGroup({ name: '' });
            }}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            {editingGroup ? 'Update Group' : 'Create Group'}
          </button>
        </div>
      </div>

      {/* Groups List */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search variant groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-4">
        {filteredGroups.map((group) => (
          <div key={group.id} className="border rounded-lg">
            <div className="flex items-center justify-between p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900">{group.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingGroup(group)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {group.items.map((item) => {
                const variant = variants.find(v => v.id === item.variant_id);
                return (
                  <div key={item.id} className="ml-4 py-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{variant?.name}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="text-gray-600">{item.custom_label}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-gray-500">{item.abbreviation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}