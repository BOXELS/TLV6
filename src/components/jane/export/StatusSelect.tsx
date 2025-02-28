import React from 'react';

type StatusSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Status
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="Draft">Draft</option>
        <option value="Published">Published</option>
        <option value="Archived">Archived</option>
      </select>
    </div>
  );
}