import React from 'react';
import { Plus, X } from 'lucide-react';
import { useJaneVariantGroups } from '../../../hooks/useJaneVariantGroups';

type Variant = {
  value: string;
  customLabel: string;
  abbreviation: string;
};

type PrimaryVariantProps = {
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
  getPrimarySubCategories: () => any[];
  loading: boolean;
};

type VariantGroup = {
  id: string;
  name: string;
  items: {
    variant_id: string;
    custom_label: string;
    abbreviation: string;
  }[];
};

export default function PrimaryVariant({
  variants,
  onVariantsChange,
  getPrimarySubCategories,
  loading
}: PrimaryVariantProps) {
  const { groups } = useJaneVariantGroups();

  const addVariant = () => {
    onVariantsChange([...variants, { value: '', customLabel: '', abbreviation: '' }]);
  };

  const removeVariant = (index: number) => {
    onVariantsChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    onVariantsChange(newVariants);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Primary Variant</h3>
      
      {/* Variant Groups Dropdown */}
      <div className="mb-4">
        <select
          onChange={(e) => {
            const group = groups.find(g => g.id === e.target.value);
            if (group) {
              const newVariants = [...variants, ...group.items.map(item => ({
                value: item.variant_id,
                customLabel: item.custom_label,
                abbreviation: item.abbreviation
              }))];
              onVariantsChange(newVariants);
            }
          }}
          className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">Add variants from group...</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>

      <div className="relative">
        <select
          value=""
          disabled
          className="w-40 text-sm rounded-md border-gray-300 bg-gray-50 shadow-sm"
        >
          <option value="">Primary Color</option>
        </select>

        <div className="space-y-2 mt-2">
          {variants.map((variant, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={variant.value}
                onChange={(e) => updateVariant(index, 'value', e.target.value)}
                className="w-40 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select Color</option>
                {!loading && getPrimarySubCategories().map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={variant.customLabel}
                onChange={(e) => updateVariant(index, 'customLabel', e.target.value)}
                placeholder="Type Custom Label"
                className="w-48 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={variant.abbreviation}
                onChange={(e) => updateVariant(index, 'abbreviation', e.target.value)}
                placeholder="Type Abbrev."
                className="w-32 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <div className="flex gap-1">
                {index === variants.length - 1 && (
                  <button
                    type="button"
                    onClick={addVariant}
                    className="w-6 h-6 flex items-center justify-center text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="w-6 h-6 flex items-center justify-center text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}