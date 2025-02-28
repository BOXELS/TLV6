import React from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import type { ViewMode } from '../../types/ui';

type ViewToggleProps = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-md shadow-sm">
      <button
        type="button"
        onClick={() => onChange('row')}
        className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
          mode === 'row'
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <LayoutList className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => onChange('card')}
        className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b -ml-px ${
          mode === 'card'
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <LayoutGrid className="h-5 w-5" />
      </button>
    </div>
  );
}