import React from 'react';

type SkuEditorProps = {
  sku: string;
  onAcronymChange: (acronym: string) => void;
};

export default function SkuEditor({ sku, onAcronymChange }: SkuEditorProps) {
  // Split SKU into ID and acronym parts
  const [id, acronym] = sku.split('-');

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        SKU
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            value={id}
            readOnly
            className="rounded-md border-gray-300 bg-gray-50 shadow-sm w-full"
          />
          <p className="mt-1 text-xs text-gray-500">ID (read-only)</p>
        </div>
        <div>
          <input
            type="text"
            value={acronym}
            onChange={(e) => onAcronymChange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-full"
          />
          <p className="mt-1 text-xs text-gray-500">Acronym</p>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        Generated SKU: {id}-{acronym}
      </div>
    </div>
  );
}