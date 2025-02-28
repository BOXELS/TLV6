import React from 'react';
import { Plus, X } from 'lucide-react';
import { useEffect } from 'react';

type SecondaryVariantRow = {
  value: string;
  customLabel: string;
  abbreviation: string;
  price: string;
  weightOz: string;
  stock: string;
};

type SecondaryVariantProps = {
  rows: SecondaryVariantRow[];
  onRowsChange: (rows: SecondaryVariantRow[]) => void;
  getSecondarySubCategories: () => any[];
  loading: boolean;
};

export default function SecondaryVariant({
  rows,
  onRowsChange,
  getSecondarySubCategories,
  loading
}: SecondaryVariantProps) {
  const [bulkPrice, setBulkPrice] = React.useState('');
  const [bulkWeight, setBulkWeight] = React.useState('');
  const [bulkStock, setBulkStock] = React.useState('');

  // Auto-populate secondary variants only on mount or when loading changes
  useEffect(() => {
    if (!loading) {
      const subCategories = getSecondarySubCategories();
      if (subCategories.length > 0) {
        const defaultRows = subCategories.map(v => ({
          value: v.id,
          customLabel: v.custom_label || '',
          abbreviation: v.abbreviation || '',
          price: '',
          weightOz: '',
          stock: ''
        }));
        onRowsChange(defaultRows);
      }
    }
  }, [loading]); // Only run when loading state changes

  const addSecondaryVariant = () => {
    onRowsChange([...rows, { 
      value: '', 
      customLabel: '', 
      abbreviation: '', 
      price: '', 
      weightOz: '', 
      stock: '' 
    }]);
  };

  const removeSecondaryVariant = (index: number) => {
    onRowsChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Secondary Variant</h3>
      <div className="relative">
        <select
          value=""
          disabled
          className="w-40 text-sm rounded-md border-gray-300 bg-gray-50 shadow-sm"
        >
          <option value="">Generic US</option>
        </select>

        {/* Bulk Update Fields */}
        <div className="grid grid-cols-7 gap-3 mt-4 mb-2">
          <div className="col-span-3"></div>
          <input
            type="text"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
            placeholder="Price"
            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={bulkWeight}
            onChange={(e) => setBulkWeight(e.target.value)}
            placeholder="Weight"
            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={bulkStock}
            onChange={(e) => setBulkStock(e.target.value)}
            placeholder="Stock"
            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => {
              onRowsChange(rows.map(row => ({
                ...row,
                price: bulkPrice || row.price,
                weightOz: bulkWeight || row.weightOz,
                stock: bulkStock || row.stock
              })));
              setBulkPrice('');
              setBulkWeight('');
              setBulkStock('');
            }}
            className="px-2 py-1 text-xs text-white bg-indigo-600 rounded hover:bg-indigo-700"
          >
            Update All
          </button>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-7 gap-3 mt-2 mb-1 px-2">
          <div className="text-xs font-medium text-gray-500">Subcategory</div>
          <div className="text-xs font-medium text-gray-500">Custom Label</div>
          <div className="text-xs font-medium text-gray-500">Abbrev.</div>
          <div className="text-xs font-medium text-gray-500">Price</div>
          <div className="text-xs font-medium text-gray-500">Weight Oz.</div>
          <div className="text-xs font-medium text-gray-500">Stock</div>
          <div className="text-xs font-medium text-gray-500"></div>
        </div>

        <div className="space-y-2 mt-2">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-7 gap-3 items-center">
              <select
                value={row.value}
                onChange={(e) => {
                  const selectedVariant = getSecondarySubCategories().find(v => v.id === e.target.value);
                  const newRows = [...rows];
                  if (selectedVariant) {
                    newRows[index] = {
                      ...newRows[index],
                      value: selectedVariant.id,
                      customLabel: selectedVariant.custom_label || '',
                      abbreviation: selectedVariant.abbreviation || '',
                      price: selectedVariant.price?.toString() || '',
                      weightOz: selectedVariant.weight_oz?.toString() || '',
                      stock: '100' // Default stock value
                    };
                  }
                  onRowsChange(newRows);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const options = getSecondarySubCategories();
                    const currentIndex = options.findIndex(v => v.id === row.value);
                    let newIndex = currentIndex;
                    
                    if (e.key === 'ArrowDown') {
                      newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : currentIndex;
                    } else {
                      newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                    }
                    
                    if (newIndex !== currentIndex) {
                      const selectedVariant = options[newIndex];
                      const newRows = [...rows];
                      newRows[index] = {
                        ...newRows[index],
                        value: selectedVariant.id,
                        customLabel: selectedVariant.custom_label || '',
                        abbreviation: selectedVariant.abbreviation || '',
                        price: selectedVariant.price?.toString() || '',
                        weightOz: selectedVariant.weight_oz?.toString() || '',
                        stock: '100'
                      };
                      onRowsChange(newRows);
                    }
                  }
                }}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select Size</option>
                {!loading && getSecondarySubCategories().map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={row.customLabel}
                onChange={(e) => {
                  const newRows = [...rows];
                  newRows[index].customLabel = e.target.value;
                  onRowsChange(newRows);
                }}
                placeholder="Type Custom Label"
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={row.abbreviation}
                onChange={(e) => {
                  const newRows = [...rows];
                  newRows[index].abbreviation = e.target.value;
                  onRowsChange(newRows);
                }}
                placeholder="Type Abbrev."
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={row.price}
                onChange={(e) => {
                  const newRows = [...rows];
                  newRows[index].price = e.target.value;
                  onRowsChange(newRows);
                }}
                placeholder="0.00"
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={row.weightOz}
                onChange={(e) => {
                  const newRows = [...rows];
                  newRows[index].weightOz = e.target.value;
                  onRowsChange(newRows);
                }}
                placeholder="0.00"
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={row.stock}
                onChange={(e) => {
                  const newRows = [...rows];
                  newRows[index].stock = e.target.value;
                  onRowsChange(newRows);
                }}
                placeholder="0"
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <div className="flex gap-1">
                {index === rows.length - 1 && (
                  <button
                    type="button"
                    onClick={addSecondaryVariant}
                    className="w-6 h-6 flex items-center justify-center text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSecondaryVariant(index)}
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