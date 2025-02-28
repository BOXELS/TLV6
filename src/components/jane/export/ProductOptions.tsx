import React from 'react';

type ProductOptionsProps = {
  isHandmade: string;
  isDigital: string;
  hasFreeShipping: string;
  onIsHandmadeChange: (value: string) => void;
  onIsDigitalChange: (value: string) => void;
  onHasFreeShippingChange: (value: string) => void;
};

export default function ProductOptions({
  isHandmade,
  isDigital,
  hasFreeShipping,
  onIsHandmadeChange,
  onIsDigitalChange,
  onHasFreeShippingChange
}: ProductOptionsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Is Handmade</label>
        <select
          value={isHandmade}
          onChange={(e) => onIsHandmadeChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Is Digital</label>
        <select
          value={isDigital}
          onChange={(e) => onIsDigitalChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Has Free Shipping</label>
        <select
          value={hasFreeShipping}
          onChange={(e) => onHasFreeShippingChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
    </div>
  );
}