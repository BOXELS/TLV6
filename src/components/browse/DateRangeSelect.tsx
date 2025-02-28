import React from 'react';

type DateRangeSelectProps = {
  value: string;
  onChange: (range: string) => void;
  onClose: () => void;
};

const ranges = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'week' },
  { label: 'Last 30 days', value: 'month' },
  { label: 'Last year', value: 'year' },
  { label: 'All time', value: '' },
];

export default function DateRangeSelect({ value, onChange, onClose }: DateRangeSelectProps) {
  return (
    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
      <div className="py-1" role="menu">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            className={`block w-full text-left px-4 py-2 text-sm ${
              value === range.value
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            role="menuitem"
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}