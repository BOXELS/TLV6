import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type Variant = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  custom_label?: string;
  abbreviation?: string;
  sort_order?: number;
};

function SortableVariant({ variant, onEdit, onDelete }: { 
  variant: Variant; 
  onEdit: (v: Variant) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: variant.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="ml-4 flex items-center justify-between py-2 cursor-move"
    >
      <div className="flex items-center flex-1">
        <div {...attributes} {...listeners} className="mr-2 text-gray-400">
          <GripVertical className="w-4 h-4" />
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
        <div>
          <div>{variant.name}</div>
          <div className="text-sm text-gray-500">
            Label: {variant.custom_label || '-'} | Abbrev: {variant.abbreviation || '-'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(variant)}
          className="p-1 text-gray-500 hover:text-indigo-600"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(variant.id)}
          className="p-1 text-gray-500 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
export default function JaneSecondaryVariants() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [newVariant, setNewVariant] = useState({
    name: '',
    parent_id: null as string | null,
    level: 1,
    custom_label: '',
    abbreviation: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('jane_secondary_variants')
        .select('*')
        .order('level, sort_order, name');

      if (error) throw error;
      setVariants(data || []);
    } catch (error) {
      console.error('Error loading variants:', error);
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = subVariants.findIndex(v => v.id === active.id);
    const newIndex = subVariants.findIndex(v => v.id === over.id);

    const reorderedVariants = [...subVariants];
    const [movedVariant] = reorderedVariants.splice(oldIndex, 1);
    reorderedVariants.splice(newIndex, 0, movedVariant);

    // Update sort_order for all variants
    const updates = reorderedVariants.map((variant, index) => ({
      id: variant.id,
      name: variant.name,
      level: variant.level,
      parent_id: variant.parent_id,
      custom_label: variant.custom_label,
      abbreviation: variant.abbreviation,
      sort_order: index
    }));

    try {
      const { error } = await supabase
        .from('jane_secondary_variants')
        .upsert(updates);

      if (error) throw error;
      
      // Update local state
      setVariants(prev => {
        const updated = [...prev];
        const mainVariant = updated.find(v => v.level === 1);
        const newVariants = [
          ...(mainVariant ? [mainVariant] : []),
          ...reorderedVariants
        ];
        return newVariants;
      });
    } catch (error) {
      console.error('Error updating sort order:', error);
      toast.error('Failed to update sort order');
    }
  };
  const handleSave = async () => {
    try {
      if (editingVariant) {
        // Update existing variant
        const { error } = await supabase
          .from('jane_secondary_variants')
          .update({
            name: editingVariant.name,
            custom_label: editingVariant.custom_label,
            abbreviation: editingVariant.abbreviation
          })
          .eq('id', editingVariant.id);

        if (error) throw error;
        toast.success('Variant updated successfully');
      } else {
        // Get max sort_order for new variants
        const { data: maxSort } = await supabase
          .from('jane_secondary_variants')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1)
          .single();

        const nextSort = (maxSort?.sort_order ?? -1) + 1;

        const { error } = await supabase
          .from('jane_secondary_variants')
          .insert([{ ...newVariant, sort_order: nextSort }]);

        if (error) throw error;
        toast.success('Variant added successfully');
        setNewVariant({
          name: '',
          parent_id: null,
          level: 1,
          custom_label: '',
          abbreviation: ''
        });
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
        .from('jane_secondary_variants')
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
          {(editingVariant?.level === 2 || newVariant.level === 2) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Label</label>
                <input
                  type="text"
                  value={editingVariant?.custom_label || newVariant.custom_label}
                  onChange={(e) => {
                    if (editingVariant) {
                      setEditingVariant({ ...editingVariant, custom_label: e.target.value });
                    } else {
                      setNewVariant({ ...newVariant, custom_label: e.target.value });
                    }
                  }}
                  className="w-full rounded-md border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation</label>
                <input
                  type="text"
                  value={editingVariant?.abbreviation || newVariant.abbreviation}
                  onChange={(e) => {
                    if (editingVariant) {
                      setEditingVariant({ ...editingVariant, abbreviation: e.target.value });
                    } else {
                      setNewVariant({ ...newVariant, abbreviation: e.target.value });
                    }
                  }}
                  className="w-full rounded-md border-gray-300"
                />
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingVariant(null);
              setNewVariant({
                name: '',
                parent_id: null,
                level: 1,
                custom_label: '',
                abbreviation: ''
              });
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subVariants.map(v => v.id)}
                strategy={verticalListSortingStrategy}
              >
                {subVariants.map(variant => (
                  <SortableVariant
                    key={variant.id}
                    variant={variant}
                    onEdit={setEditingVariant}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}
    </div>
  );
}