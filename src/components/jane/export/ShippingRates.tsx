import React from 'react';

type ShippingRatesProps = {
  shippingFirst: string;
  shippingAdditional: string;
  onShippingFirstChange: (value: string) => void;
  onShippingAdditionalChange: (value: string) => void;
};

export default function ShippingRates({
  shippingFirst,
  shippingAdditional,
  onShippingFirstChange,
  onShippingAdditionalChange
}: ShippingRatesProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Shipping Rate First</label>
        <input
          type="text"
          value={shippingFirst}
          onChange={(e) => onShippingFirstChange(e.target.value)}
          placeholder="Leave blank for free shipping"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Shipping Rate Additional</label>
        <input
          type="text"
          value={shippingAdditional}
          onChange={(e) => onShippingAdditionalChange(e.target.value)}
          placeholder="Leave blank for free shipping"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
    </div>
  );
}