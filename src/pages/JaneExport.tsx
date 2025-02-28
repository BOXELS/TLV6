import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileDown, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import ProductCategory from '../components/jane/export/ProductCategory';
import ProductOptions from '../components/jane/export/ProductOptions';
import ShippingRates from '../components/jane/export/ShippingRates';
import StatusSelect from '../components/jane/export/StatusSelect';
import TitleAppendSelect from '../components/jane/export/TitleAppendSelect';
import PrimaryVariant from '../components/jane/export/PrimaryVariant';
import SecondaryVariant from '../components/jane/export/SecondaryVariant';
import StyleAndDescription from '../components/jane/export/StyleAndDescription';
import { generateDesignCsv, downloadCsv } from '../utils/janeCsvExport';
import { useJaneCategories } from '../hooks/useJaneCategories';
import { useJanePrimaryVariants } from '../hooks/useJanePrimaryVariants';
import { useJaneSecondaryVariants } from '../hooks/useJaneSecondaryVariants';
import toast from 'react-hot-toast';
import type { DesignFile } from '../types/database';
import { Loader2 } from 'lucide-react';

type Variant = {
  value: string;
  customLabel: string;
  abbreviation: string;
};

export default function JaneExport() {
  const navigate = useNavigate();
  const location = useLocation();
  const designs = location.state?.designs as DesignFile[];

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
  const [status, setStatus] = useState('Draft');
  const [titleAppend, setTitleAppend] = useState('None (default)');
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
    
    // Description validation
    if (!description.trim()) {
      errors.push('Please enter a description');
    }
    
    return errors;
  };

  // Render loading state
  if (loadingCategories || loadingPrimaryVariants || loadingSecondaryVariants) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <FileDown className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Loading Jane Export Configuration...</h2>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render error state
  if (!categories.length || !primaryVariants.length || !secondaryVariants.length) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <FileDown className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Jane Export Configuration</h2>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Failed to load required data. Please try again.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  const handleGenerateCsv = async () => {
    if (loadingCategories || loadingPrimaryVariants || loadingSecondaryVariants) {
      toast.error('Please wait for all data to load');
      return;
    }

    const errors = validateFields();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      // Get variant names from the selected values
      const variantsWithNames = variants.map(variant => ({
        ...variant,
        name: getPrimarySubCategories().find(v => v.id === variant.value)?.name
      }));

      const secondaryVariantsWithNames = secondaryVariantRows.map(size => ({
        ...size,
        name: getSecondarySubCategories().find(v => v.id === size.value)?.name
      }));

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
          status,
          description,
          titleAppend,
          variants: variantsWithNames,
          secondaryVariants: secondaryVariantsWithNames
        }
      );
      const filename = `jane_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      try {
        await downloadCsv(csvContent, filename, designs, { styleId, titleAppend });
        toast.success('CSV file generated and designs marked as listed on Jane');
      } catch (error) {
        console.error('Error during CSV export:', error);
        toast.error('Failed to complete export process');
      }
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Failed to generate CSV file');
    }
  };

  if (!designs?.length) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Please select designs to export from the dashboard.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <FileDown className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Jane Export Configuration</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {designs.length} design{designs.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Design Thumbnails */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Designs</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {designs.map((design) => (
              <div key={design.id} className="relative group hover-zoom-container">
                <div className="flex flex-col gap-4">
                  {/* Design Thumbnail */}
                  <div className="w-48 h-48 bg-white rounded-lg border overflow-hidden shadow hover:shadow-lg transition-all flex-shrink-0">
                    <img
                      src={design.web_file_url}
                      alt={design.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Mockup Thumbnails */}
                  <div className="grid grid-cols-3 gap-3">
                    {design.mockups?.slice(0, 6).map((mockup, idx) => (
                      <div key={mockup.id} className="relative group/mockup">
                        <div className="w-full aspect-square bg-white rounded border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <img
                          src={mockup.thumb_url}
                          alt={`${design.title} mockup ${idx + 1}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                        </div>
                        {/* Zoomed preview */}
                        <div className="fixed transform -translate-x-1/2 -translate-y-1/2 opacity-0 invisible group-hover/mockup:opacity-100 group-hover/mockup:visible transition-all duration-200 z-50 pointer-events-none">
                          <div className="relative">
                            <div className="absolute inset-0 -m-2 bg-white/80 rounded-lg blur"></div>
                            <img
                              src={mockup.url}
                              alt={`${design.title} mockup ${idx + 1} (zoomed)`}
                              className="relative w-[600px] aspect-square object-contain bg-white rounded-lg shadow-xl border"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {design.mockups?.length === 0 && (
                      <div className="w-full aspect-square bg-gray-50 rounded border flex items-center justify-center text-gray-400 text-sm">
                        No<br/>Mockups
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex flex-col items-center justify-center p-2 pointer-events-none z-10">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                    <p className="text-sm font-medium text-white mb-1 line-clamp-2">
                      {design.title}
                    </p>
                    <p className="text-xs text-gray-200">
                      {design.sku}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* Title Append */}
            <div className="grid grid-cols-2 gap-4">
              <TitleAppendSelect
                value={titleAppend}
                onChange={setTitleAppend}
              />
              <StatusSelect
                value={status}
                onChange={setStatus}
              />
            </div>

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
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
            <button
              onClick={() => navigate('/dashboard')}
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
    </DashboardLayout>
  );
}