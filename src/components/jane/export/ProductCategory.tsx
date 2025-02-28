import React from 'react';

type ProductCategoryProps = {
  mainCategory: string;
  subCategory: string;
  type: string;
  onMainCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  getMainCategories: () => any[];
  getSubCategories: (id: string) => any[];
  getTypes: (id: string) => any[];
  loading: boolean;
};

export default function ProductCategory({
  mainCategory,
  subCategory,
  type,
  onMainCategoryChange,
  onSubCategoryChange,
  onTypeChange,
  getMainCategories,
  getSubCategories,
  getTypes,
  loading
}: ProductCategoryProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Product Category <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-3 gap-4">
        <select
          value={mainCategory}
          onChange={(e) => {
            onMainCategoryChange(e.target.value);
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          disabled={loading}
        >
          <option value="">Category</option>
          {getMainCategories().map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        
        <select
          value={subCategory}
          onChange={(e) => {
            onSubCategoryChange(e.target.value);
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          disabled={!mainCategory || loading}
        >
          <option value="">Sub Category</option>
          {mainCategory && getSubCategories(mainCategory).map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          disabled={!subCategory || loading}
        >
          <option value="">Type</option>
          {subCategory && getTypes(subCategory).map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}