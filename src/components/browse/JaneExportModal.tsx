import React, { useState } from 'react';
import { useJaneCategories } from '../../hooks/useJaneCategories';
import { useJanePrimaryVariants } from '../../hooks/useJanePrimaryVariants';
import { useJaneSecondaryVariants } from '../../hooks/useJaneSecondaryVariants';
import ProductCategory from '../jane/export/ProductCategory';
import ProductOptions from '../jane/export/ProductOptions';
import ShippingRates from '../jane/export/ShippingRates';
import PrimaryVariant from '../jane/export/PrimaryVariant';
import SecondaryVariant from '../jane/export/SecondaryVariant';
import StyleAndDescription from '../jane/export/StyleAndDescription';
import { generateDesignCsv } from '../../utils/janeCsvExport';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import type { DesignFile } from '../../types/database';

type Variant = {
  value: string;
  customLabel: string;
  abbreviation: string;
};

type JaneExportModalProps = {
  onClose: () => void;
  designs: DesignFile[];
};

export default function JaneExportModal({ onClose, designs }: JaneExportModalProps) {
  const { categories, loading: loadingCategories, getMainCategories, getSubCategories, getTypes } = useJaneCategories();
  const { variants: primaryVariants, loading: loadingPrimaryVariants, getMainCategory, getSubCategories: getPrimarySubCategories } = useJanePrimaryVariants();
  const { variants: secondaryVariants, loading: loadingSecondaryVariants, getMainCategory: getSecondaryMainCategory, getSubCategories: getSecondarySubCategories } = useJaneSecondaryVariants();
  
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [styleId, setStyleId] = useState('');
  const [shippingFirst, setShippingFirst] = useState('');
  const [shippingAdditional, setShippingAdditional] = useState('');
  const [isHandmade, setIsHandmade] = useState('Yes');
  const [isDigital, setIsDigital] = useState('No');
  const [hasFreeShipping, setHasFreeShipping] = useState('Yes');
  const [variants, setVariants] = useState<Variant[]>([{ value: '', customLabel: '', abbreviation: '' }]);
  const [secondaryVariantRows, setSecondaryVariantRows] = useState<Array<{
    value: string;
    customLabel: string;
    abbreviation: string;
    price: string;
    weightOz: string;
    stock: string;
  }>>([{ value: '', customLabel: '', abbreviation: '', price: '', weightOz: '', stock: '' }]);

  // Get category path
  const getCategoryPath = () => {
    const mainCat = getMainCategories().find(c => c.id === mainCategory)?.name || '';
    const subCat = getSubCategories(mainCategory).find(c => c.id === subCategory)?.name || '';
    return [mainCat, subCat].filter(Boolean).join(' > ');
  };
  const addVariant = () => {
    setVariants([...variants, { value: '', customLabel: '', abbreviation: '' }]);
  };

  const addSecondaryVariant = () => {
    setSecondaryVariantRows([...secondaryVariantRows, { 
      value: '', 
      customLabel: '', 
      abbreviation: '', 
      price: '', 
      weightOz: '', 
      stock: '' 
    }]);
  };

  const removeSecondaryVariant = (index: number) => {
    setSecondaryVariantRows(secondaryVariantRows.filter((_, i) => i !== index));
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const generateVariantSkus = () => {
    if (!designs?.length) return [];
    
    // Validate style ID
    if (!styleId || styleId === 'ie: 6030, 3001, 3001cvc') return [];
    
    const skus = [];
    for (const design of designs) {
      for (const variant of variants) {
        for (const size of secondaryVariantRows) {
          if (!variant.value || !size.value) continue;
          const sku = `${design.sku}_${styleId}-${variant.abbreviation}_${size.abbreviation}`;
          skus.push({
            sku,
            primaryVariant: variant.value,
            primaryLabel: variant.customLabel,
            secondaryVariant: size.value,
            secondaryLabel: size.customLabel
          });
        }
      }
    }
    return skus;
  };

  const generateCsvPreview = () => {
    if (!designs?.length) return [];
    
    const rows = [];
    const variantSkus = generateVariantSkus();
    
    for (const sku of variantSkus) {
      const design = designs.find(d => d.sku === sku.sku.split('_')[0]);
      if (!design) continue;
      
      rows.push({
        sku: sku.sku,
        name: design.title,
        productUrl: design.web_file_url,
        category: `${mainCategory?.name} > ${subCategory?.name} > ${type?.name}`,
        type: 'Graphic Tee'
      });
    }
    return rows;
  };

  const [showVariantPreview, setShowVariantPreview] = useState(false);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [selectedDesignSku, setSelectedDesignSku] = useState('');

  // Auto-populate secondary variants on mount
  React.useEffect(() => {
    if (!loadingSecondaryVariants) {
      const subCategories = getSecondarySubCategories();
      if (subCategories.length > 0) {
        setSecondaryVariantRows(subCategories.map(v => ({
          value: v.id,
          customLabel: v.custom_label || '',
          abbreviation: v.abbreviation || '',
          price: '',
          weightOz: '',
          stock: ''
        })));
      }
    }
  }, [loadingSecondaryVariants]);

  const validateFields = () => {
    const errors = [];
    
    // Style ID validation (moved to top since it's required for SKU generation)
    if (!styleId || styleId === 'ie: 6030, 3001, 3001cvc' || /[^a-zA-Z0-9]/.test(styleId)) {
      errors.push('Please enter a valid Style ID (numbers and letters only)');
      return errors;
    }
    
    // Product Category validation
    if (!mainCategory || !subCategory || !type) {
      errors.push('Please select all product category fields');
    }
    
    // Primary Variant validation
    const invalidPrimaryVariants = variants.some(v => !v.value || !v.customLabel || !v.abbreviation);
    if (invalidPrimaryVariants) {
      errors.push('Please fill in all primary variant fields (Color, Custom Label, Abbreviation)');
    }
    
    // Secondary Variant validation
    const invalidSecondaryVariants = secondaryVariantRows.some(
      v => !v.value || !v.customLabel || !v.abbreviation || !v.price || !v.weightOz || !v.stock
    );
    if (invalidSecondaryVariants) {
      errors.push('Please fill in all secondary variant fields (Size, Custom Label, Abbreviation, Price, Weight, Stock)');
    }
    
    // Style ID validation
    if (!styleId || styleId === 'ie: 6030, 3001, 3001cvc' || /[^a-zA-Z0-9]/.test(styleId)) {
      errors.push('Please enter a valid Style ID (numbers and letters only)');
    }
    
    // Description validation
    if (!description.trim()) {
      errors.push('Please enter a description');
    }
    
    return errors;
  };

  const handlePreviewVariants = () => {
    const errors = validateFields();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    setShowVariantPreview(true);
  };

  const handlePreviewCsv = () => {
    const errors = validateFields();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    setShowCsvPreview(true);
  };

  const handleGenerateCsv = () => {
    const errors = validateFields();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    const categoryPath = getCategoryPath();
    const typeName = getTypes(subCategory).find(t => t.id === type)?.name || '';

    const csvContent = generateDesignCsv(
      designs,
      categoryPath,
      typeName,
      {
        styleId,
        isHandmade,
        isDigital,
        hasFreeShipping,
        shippingFirst,
        shippingAdditional,
        description,
        variants,
        secondaryVariants: secondaryVariantRows
      }
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `jane_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV file generated successfully');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Jane Export CSV Configuration</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Designs: {designs.length} selected</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Product Category */}
          <ProductCategory
            mainCategory={mainCategory}
            subCategory={subCategory}
            type={type}
            onMainCategoryChange={(value) => {
              setMainCategory(value);
              setSubCategory('');
              setType('');
            }}
            onSubCategoryChange={(value) => {
              setSubCategory(value);
              setType('');
            }}
            onTypeChange={setType}
            getMainCategories={getMainCategories}
            getSubCategories={getSubCategories}
            getTypes={getTypes}
            loading={loadingCategories}
          />

          {/* Options Row */}
          <ProductOptions
            isHandmade={isHandmade}
            isDigital={isDigital}
            hasFreeShipping={hasFreeShipping}
            onIsHandmadeChange={setIsHandmade}
            onIsDigitalChange={setIsDigital}
            onHasFreeShippingChange={setHasFreeShipping}
          />

          {/* Shipping Rates */}
          <ShippingRates
            shippingFirst={shippingFirst}
            shippingAdditional={shippingAdditional}
            onShippingFirstChange={setShippingFirst}
            onShippingAdditionalChange={setShippingAdditional}
          />

          {/* Primary Variant */}
          <PrimaryVariant
            variants={variants}
            onVariantsChange={setVariants}
            getPrimarySubCategories={getPrimarySubCategories}
            loading={loadingPrimaryVariants}
          />

          {/* Secondary Variant */}
          <SecondaryVariant
            rows={secondaryVariantRows}
            onRowsChange={setSecondaryVariantRows}
            getSecondarySubCategories={getSecondarySubCategories}
            loading={loadingSecondaryVariants}
          />

          {/* Style ID and Description */}
          <StyleAndDescription
            styleId={styleId}
            description={description}
            onStyleIdChange={setStyleId}
            onDescriptionChange={setDescription}
          />

          {/* Preview Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={selectedDesignSku}
                onChange={(e) => setSelectedDesignSku(e.target.value)}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select Design</option>
                {designs.map(design => (
                  <option key={design.id} value={design.sku}>{design.sku}</option>
                ))}
              </select>
              <button 
                onClick={handlePreviewVariants}
                disabled={!selectedDesignSku}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Preview Variant SKUs
              </button>
            </div>
          </div>

          {/* Variant SKUs Preview Modal */}
          {showVariantPreview && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Variant SKUs Preview</h3>
                  <button onClick={() => setShowVariantPreview(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generateVariantSkus().map((sku, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm">{sku.sku}</td>
                          <td className="px-3 py-2 text-sm">{sku.primaryLabel}</td>
                          <td className="px-3 py-2 text-sm">{sku.secondaryLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateCsv}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Generate CSV
          </button>
        </div>
      </div>
    </div>
  );
}