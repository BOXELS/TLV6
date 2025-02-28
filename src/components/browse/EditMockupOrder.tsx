import React from 'react';
import { Star, GripVertical, Trash2, Download } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../../lib/supabase';
import type { DesignFile } from '../../types/database';
import toast from 'react-hot-toast';

type EditMockupOrderProps = {
  designs: DesignFile[];
  onDesignUpdate: () => Promise<void>;
};

function SortableMockup({ design, mockup, onSetMain }: { 
  design: DesignFile;
  mockup: any;
  onSetMain: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: mockup.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex-shrink-0 relative group">
      <div {...attributes} {...listeners} className="cursor-move text-gray-400 hover:text-gray-600">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="w-32 h-32 bg-gray-50 rounded border overflow-hidden">
        <img
          src={mockup.thumb_url}
          alt="Mockup thumbnail"
          className="w-full h-full object-contain"
        />
      </div>
      <button
        onClick={onSetMain}
        className={`absolute top-2 right-2 p-2 rounded-full ${
          mockup.is_main
            ? 'bg-yellow-100 text-yellow-600'
            : 'bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-yellow-50 hover:text-yellow-600'
        }`}
        title={mockup.is_main ? 'Main Image' : 'Set as Main Image'}
      >
        <Star className="w-5 h-5" />
      </button>
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <a
          href={mockup.url}
          download
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-full bg-indigo-100 text-indigo-600 opacity-0 group-hover:opacity-100 hover:bg-indigo-200"
          title="Download Full Size"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Are you sure you want to delete this mockup? This action cannot be undone.')) {
              onDelete();
            }
          }}
          className="p-2 rounded-full bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-200"
          title="Delete Mockup"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {mockup.is_main ? 'Main' : design.mockups
          .filter(m => !m.is_main)
          .findIndex(m => m.id === mockup.id) + 1}
      </div>
    </div>
  );
}

export default function EditMockupOrder({ designs, onDesignUpdate }: EditMockupOrderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any, design: DesignFile) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !design.mockups) return;

    const oldIndex = design.mockups.findIndex(m => m.id === active.id);
    const newIndex = design.mockups.findIndex(m => m.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    try {
      // Create a new array with the updated order
      const newOrder = [...design.mockups];
      const [movedMockup] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, movedMockup);

      // Update the order on the server
      const { error } = await supabase.rpc('update_mockup_order', {
        p_mockup_ids: newOrder.map(m => m.id),
        p_design_id: design.id
      });

      if (error) throw error;

      // Let parent component handle the refresh
      await onDesignUpdate();
      toast.success('Mockup order updated');
    } catch (error) {
      console.error('Error reordering mockups:', error);
      toast.error('Failed to update mockup order');
      // Refresh to ensure UI is in sync
      await onDesignUpdate();
    }
  };

  const handleSetMain = async (design: DesignFile, mockupId: string) => {
    try {
      if (!design.mockups) return;

      const { error } = await supabase.rpc('set_main_mockup', {
        p_mockup_id: mockupId,
        p_design_id: design.id
      });

      if (error) throw error;

      // Let parent component handle the refresh
      await onDesignUpdate();
      toast.success('Main image updated');
    } catch (error) {
      console.error('Error setting main image:', error);
      toast.error('Failed to update main image');
      // Refresh to ensure UI is in sync
      await onDesignUpdate();
    }
  };

  const handleDelete = async (design: DesignFile, mockupId: string) => {
    try {
      // Delete the mockup record
      const { error } = await supabase
        .from('design_mockups')
        .delete()
        .eq('id', mockupId)
        .eq('design_id', design.id);

      if (error) throw error;

      // Let parent component handle the refresh
      await onDesignUpdate();
      toast.success('Mockup deleted');
    } catch (error) {
      console.error('Error deleting mockup:', error);
      toast.error('Failed to delete mockup');
      // Refresh to ensure UI is in sync
      await onDesignUpdate();
    }
  };

  return (
    <div className="space-y-8">
      {designs.map((design) => (
        <div key={design.id} className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Print File Thumbnail */}
              <div className="w-24 h-24 bg-white rounded border">
                <img
                  src={design.web_file_url}
                  alt={design.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1">
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900">{design.title}</h3>
                  <p className="text-sm text-gray-500">{design.sku}</p>
                </div>

                {/* Mockups Row */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, design)}
                >
                  <SortableContext
                    items={design.mockups?.map(m => m.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {design.mockups?.map((mockup) => (
                        <SortableMockup
                          key={mockup.id}
                          design={design}
                          mockup={mockup}
                          onSetMain={() => handleSetMain(design, mockup.id)}
                          onDelete={() => handleDelete(design, mockup.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}