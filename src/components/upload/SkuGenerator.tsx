import React from 'react';
import { Loader2 } from 'lucide-react';

type SkuGeneratorProps = {
  skuId: string;
  skuAcronym: string;
  onSkuIdChange: (value: string) => void;
  onSkuAcronymChange: (value: string) => void;
  readOnly?: boolean;
  loading?: boolean;
};

export default function SkuGenerator({
  skuId,
  skuAcronym,
  onSkuIdChange,
  onSkuAcronymChange,
  readOnly = false,
  loading = false,
}: SkuGeneratorProps) {
  const generateSKU = () => {
    if (!skuId || !skuAcronym) return '';
    return `${skuId}-${skuAcronym}`;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        SKU Generator *
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="ID Number"
            value={skuId}
            onChange={(e) => onSkuIdChange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-full"
            required
            readOnly={readOnly || loading}
          />
          {loading && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        <input
          type="text"
          placeholder="Acronym"
          value={skuAcronym}
          onChange={(e) => onSkuAcronymChange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-full"
          required
          readOnly={readOnly}
        />
      </div>
      <div className="text-sm text-gray-500">
        Generated SKU: {generateSKU() || 'Please fill in all fields'}
      </div>
    </div>
  );
}