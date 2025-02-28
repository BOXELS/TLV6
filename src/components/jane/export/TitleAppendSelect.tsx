import React from 'react';
import { useJaneTitleAppends } from '../../../hooks/useJaneTitleAppends';

type TitleAppendSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function TitleAppendSelect({ value, onChange }: TitleAppendSelectProps) {
  const { appends, loading } = useJaneTitleAppends();

  if (loading) {
    return (
      <div className="animate-pulse">
        <label className="block text-sm font-medium text-gray-700">
          Append to Title
        </label>
        <div className="mt-1 h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Append to Title
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        {appends.map((append) => (
          <option key={append.id} value={append.text}>
            {append.text}
          </option>
        ))}
      </select>
    </div>
  );
}