import React from 'react';
import type { DesignFile, DesignMockup } from '../../types/database';
import PrintFileUpload from '../upload/PrintFileUpload';
import { Trash2, Star, GripVertical, Download } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type EditFileSectionProps = {
  design: DesignFile;
  onFileUploaded: (file: File) => void;
  backgroundColor: 'white' | 'black';
  onBackgroundColorChange: (color: 'white' | 'black') => void;
  mockupFiles?: File[];
  onMockupsChange: (files: File[]) => void;
  onSaveMockups: () => void;
  savingMockups: boolean;
  hasPendingMockups: boolean;
  onRemoveMockup?: (ids: string[]) => Promise<void>;
  onSetMainMockup?: (id: string) => Promise<void>;
  onReorderMockups?: (ids: string[]) => Promise<void>;
};

function SortableMockup({ mockup, onSetMain, isSelected, onSelect }: {
  mockup: DesignMockup;
  onSetMain: () => void;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
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
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded border-gray-300"
        />
        <div {...attributes} {...listeners} className="cursor-move text-gray-400 hover:text-gray-600">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
        <a
          href={mockup.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200 pointer-events-auto"
          title="Download Full Size"
        >
          <Download className="w-6 h-6 text-gray-800" />
        </a>
      </div>
      <img
        src={mockup.url}
        alt="Mockup"
        className="w-full aspect-square object-contain border rounded-lg bg-white relative"
      />
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {mockup.is_main ? 'Main' : mockup.sort_order + 1}
      </div>
      <button
        onClick={onSetMain}
        className={`absolute top-2 right-2 p-1 rounded-full ${
          mockup.is_main
            ? 'bg-yellow-100 text-yellow-600'
            : 'bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100'
        } transition-opacity`}
        title={mockup.is_main ? 'Main Image' : 'Set as Main Image'}
      >
        <Star className="w-4 h-4" />
      </button>
    </div>
  );
}
export default function EditFileSection({ 
  design, 
  onFileUploaded,
  backgroundColor,
  onBackgroundColorChange,
  mockupFiles = [],
  onMockupsChange,
  onSaveMockups,
  savingMockups,
  hasPendingMockups,
  onRemoveMockup,
  onSetMainMockup,
  onReorderMockups
}: EditFileSectionProps) {
  const [selectedMockups, setSelectedMockups] = React.useState<string[]>([]);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectedMockups(checked ? (design.mockups?.map(m => m.id) || []) : []);
  };

  const handleDeleteSelected = async () => {
    if (!onRemoveMockup || selectedMockups.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedMockups.length} mockup${selectedMockups.length > 1 ? 's' : ''}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onRemoveMockup(selectedMockups);
      setSelectedMockups([]);
    } finally {
      setIsDeleting(false);
    }
  };
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !onReorderMockups || !design.mockups) return;

    const oldIndex = design.mockups?.findIndex(m => m.id === active.id);
    const newIndex = design.mockups?.findIndex(m => m.id === over.id);

    if (oldIndex === undefined || newIndex === undefined) return;

    const newOrder = [...(design.mockups || [])];
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    await onReorderMockups(newOrder.map(m => m.id));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Current File</h3>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">SKU</div>
        <div className="text-sm text-gray-900">{design.sku}</div>
      </div>

      <div className="mb-6">
        <div className="text-sm font-medium text-gray-700 mb-2">Current Design</div>
        <div className="relative aspect-square w-full border rounded-lg bg-gray-50 overflow-hidden group">
          <img
            src={design.web_file_url}
            alt={design.title}
            className="w-full h-full object-contain"
          />
          <a
            href={design.print_file_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <div className="bg-white rounded-lg p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
              <Download className="w-6 h-6 text-gray-800" />
            </div>
          </a>
        </div>
      </div>

      {design.mockups && design.mockups.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Mockups ({design.mockups?.length || 0})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedMockups.length === design.mockups.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Select All
              </label>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedMockups.length === 0 || isDeleting}
                className="flex items-center px-2 py-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </button>
            </div>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={design.mockups.map(m => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {design.mockups.map((mockup) => (
                  <SortableMockup
                    key={mockup.id}
                    mockup={mockup}
                    onSetMain={() => onSetMainMockup?.(mockup.id)}
                    isSelected={selectedMockups.includes(mockup.id)}
                    onSelect={(checked) => {
                      setSelectedMockups(prev => 
                        checked
                          ? [...prev, mockup.id]
                          : prev.filter(id => id !== mockup.id)
                      );
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
      
      {/* Mockup Upload Section */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-700">Upload New Mockups</h3>
          {hasPendingMockups && (
            <button
              onClick={onSaveMockups}
              disabled={savingMockups}
              className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingMockups ? 'Saving...' : 'Save New Mockups'}
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-center w-full">
          <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
            <input
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.svg"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                onMockupsChange(files);
              }}
              className="hidden"
            />
            <span className="text-sm">Click to upload mockup images</span>
            {hasPendingMockups && (
              <span className="mt-2 text-xs text-indigo-600">
                {mockupFiles.length} new mockup{mockupFiles.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </label>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Upload New File (Optional)</div>
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm text-gray-600">Background Color:</label>
          <select
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value as 'white' | 'black')}
            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
        <PrintFileUpload 
          onFileUploaded={onFileUploaded}
          backgroundColor={backgroundColor}
        />
        <p className="mt-2 text-sm text-gray-500">
          Leave empty to keep the current file
        </p>
      </div>
    </div>
  );
}