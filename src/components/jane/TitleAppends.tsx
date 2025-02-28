import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type TitleAppend = {
  id: string;
  text: string;
  is_default: boolean;
  sort_order: number;
};

function SortableAppend({ append, onEdit, onDelete }: { 
  append: TitleAppend;
  onEdit: (append: TitleAppend) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: append.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between py-2 cursor-move"
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="text-gray-400">
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="text-gray-900">{append.text}</span>
        {append.is_default && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Default</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(append)}
          className="text-indigo-600 hover:text-indigo-900"
          disabled={append.is_default}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(append.id)}
          className="text-red-600 hover:text-red-900"
          disabled={append.is_default}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function TitleAppends() {
  const [appends, setAppends] = useState<TitleAppend[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppend, setEditingAppend] = useState<TitleAppend | null>(null);
  const [newAppend, setNewAppend] = useState({ text: '' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadAppends();
  }, []);

  const loadAppends = async () => {
    try {
      const { data, error } = await supabase
        .from('jane_title_appends')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setAppends(data || []);
    } catch (error) {
      console.error('Error loading title appends:', error);
      toast.error('Failed to load title appends');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingAppend) {
        const { error } = await supabase
          .from('jane_title_appends')
          .update({ text: editingAppend.text })
          .eq('id', editingAppend.id);

        if (error) throw error;
        toast.success('Title append updated successfully');
      } else {
        const { error } = await supabase
          .from('jane_title_appends')
          .insert([{ 
            text: newAppend.text,
            sort_order: appends.length
          }]);

        if (error) throw error;
        toast.success('Title append added successfully');
        setNewAppend({ text: '' });
      }

      setEditingAppend(null);
      loadAppends();
    } catch (error) {
      console.error('Error saving title append:', error);
      toast.error('Failed to save title append');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this title append?')) return;

    try {
      const { error } = await supabase
        .from('jane_title_appends')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Title append deleted successfully');
      loadAppends();
    } catch (error) {
      console.error('Error deleting title append:', error);
      toast.error('Failed to delete title append');
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = appends.findIndex(a => a.id === active.id);
    const newIndex = appends.findIndex(a => a.id === over.id);

    const reorderedAppends = [...appends];
    const [movedAppend] = reorderedAppends.splice(oldIndex, 1);
    reorderedAppends.splice(newIndex, 0, movedAppend);

    // Update sort_order for all appends
    const updates = reorderedAppends.map((append, index) => ({
      id: append.id,
      sort_order: index
    }));

    try {
      const { error } = await supabase
        .from('jane_title_appends')
        .upsert(updates);

      if (error) throw error;
      
      // Update local state
      setAppends(reorderedAppends);
    } catch (error) {
      console.error('Error updating sort order:', error);
      toast.error('Failed to update order');
    }
  };

  if (loading) {
    return <div className="p-6">Loading title appends...</div>;
  }

  return (
    <div className="p-6">
      {/* Add/Edit Form */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium mb-4">
          {editingAppend ? 'Edit Title Append' : 'Add New Title Append'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text to Append
            </label>
            <input
              type="text"
              value={editingAppend?.text || newAppend.text}
              onChange={(e) => {
                if (editingAppend) {
                  setEditingAppend({ ...editingAppend, text: e.target.value });
                } else {
                  setNewAppend({ text: e.target.value });
                }
              }}
              className="w-full rounded-md border-gray-300"
              placeholder="e.g., Unisex Soft T-shirt"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditingAppend(null);
                setNewAppend({ text: '' });
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {editingAppend ? 'Update' : 'Add'} Title Append
            </button>
          </div>
        </div>
      </div>

      {/* Title Appends List */}
      <div className="border rounded-lg">
        <div className="p-4 bg-gray-50 rounded-t-lg">
          <h3 className="font-medium">Title Appends</h3>
        </div>
        <div className="p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={appends.map(a => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {appends.map((append) => (
                <SortableAppend
                  key={append.id}
                  append={append}
                  onEdit={setEditingAppend}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}