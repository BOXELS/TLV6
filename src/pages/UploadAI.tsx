import React, { useState } from 'react';
import { Sparkles, Upload as UploadIcon, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import CategorySelect from '../components/upload/CategorySelect';
import { getNextSkuId } from '../utils/skuGenerator';
import { uploadFile } from '../utils/fileUpload';
import toast from 'react-hot-toast';
import { analyzeImage } from '../utils/openai';
import type { Category } from '../types/database';

type UploadItem = {
  file: File;
  title: string;
  keywords: string[];
  preview: string;
  processing: boolean;
  sku: string;
  progress?: {
    step: 'analyzing' | 'uploading' | 'saving';
    message: string;
  };
  error?: string;
  result?: {
    title: string;
    description: string;
    keywords: string[];
  };
  printUrl?: string;
  webUrl?: string;
};

function UploadAI() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [backgroundColor, setBackgroundColor] = useState<'white' | 'black'>('white');
  const [nextId, setNextId] = useState<string>('');

  // Load next available SKU ID
  React.useEffect(() => {
    const loadNextId = async () => {
      const id = await getNextSkuId();
      setNextId(id);
    };
    loadNextId();
  }, []);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    let currentId = parseInt(nextId);

    // Create preview URLs and initial items
    const newItems = files.map(file => {
      // Generate acronym from filename
      const name = file.name.substring(0, file.name.lastIndexOf('.'));
      const acronym = name
        .split(/[\s-]+/)
        .slice(0, 6)
        .map(word => word[0]?.toUpperCase() || '')
        .join('');

      const sku = `${currentId}`;
      currentId++;

      return {
        file,
        title: '',
        keywords: [],
        preview: URL.createObjectURL(file),
        processing: false,
        sku: `${sku}-${acronym}`
      };
    });

    setItems(prev => [...prev, ...newItems]);
    setNextId(currentId.toString());
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => {
      const newItems = [...prev];
      URL.revokeObjectURL(newItems[index].preview);
      newItems.splice(index, 1);
      return newItems;
    });
  };

  const processWithAI = async (index: number) => {
    const item = items[index];
    if (item.processing) return;
    try {
      setItems(prev => {
        const newItems = [...prev];
        newItems[index].processing = true;
        newItems[index].error = undefined;
        newItems[index].progress = {
          step: 'analyzing',
          message: 'Analyzing with AI...'
        };
        return newItems;
      });

      const result = await analyzeImage(item.file);
      if (!result) throw new Error('Failed to analyze image');

      // Generate acronym from AI title
      const acronym = result.title
        .split(/[\s-]+/)
        .slice(0, 6)
        .map(word => word[0]?.toUpperCase() || '')
        .join('');

      // Get base SKU ID
      const [id] = item.sku.split('-');

      // Update item with results
      setItems(prev => {
        const newItems = [...prev];
        newItems[index] = {
          ...newItems[index],
          title: result.title,
          sku: `${id}-${acronym}`,
          keywords: result.keywords,
          processing: false,
          result,
          progress: undefined
        };
        return newItems;
      });

      toast.success('Processing complete');
    } catch (error) {
      console.error('Error processing file:', error);
      setItems(prev => {
        const newItems = [...prev];
        newItems[index].processing = false;
        newItems[index].error = error.message || 'Failed to process file';
        newItems[index].progress = undefined;
        return newItems;
      });
      toast.error(error.message || 'Failed to process file');
    }
  };

  const handleSaveAll = async () => {
    if (!user) {
      toast.error('Please log in to upload files');
      return;
    }

    if (!items.length) {
      toast.error('Please select files to upload');
      return;
    }

    if (!selectedCategories.length) {
      toast.error('Please select at least one category');
      return;
    }

    // Check if all items have been processed by AI
    const unprocessedItems = items.filter(item => !item.result);
    if (unprocessedItems.length > 0) {
      toast.error('Please process all items with AI first');
      return;
    }

    setLoading(true);
    const results = [];

    try {
      for (const item of items) {
        try {
          // Upload file
          console.log('Uploading files for:', item.sku);
          const fileExt = item.file.name.substring(item.file.name.lastIndexOf('.'));
          const filePath = `prints/${item.sku}${fileExt}`;
          const { printUrl, webUrl } = await uploadFile(item.file, filePath, {
            backgroundColor
          });

          console.log('Creating design record for:', item.sku);

          // Create design record
          const { data: design, error: designError } = await supabase
            .from('design_files')
            .insert({
              sku: item.sku,
              title: item.title,
              description: item.result?.description || '',
              uploaded_by: user.id,
              description: item.result?.description || '',
              print_file_url: printUrl,
              web_file_url: webUrl
            })
            .select()
            .single();

          if (designError) {
            console.error('Error creating design record:', designError);
            throw designError;
          }

          console.log('Design record created:', design?.id);

          // Add categories
          if (selectedCategories.length > 0) {
            console.log('Adding categories for:', item.sku);
            const { error: categoriesError } = await supabase
              .from('design_categories')
              .insert(
                selectedCategories.map(categoryId => ({
                  design_id: design.id,
                  category_id: categoryId,
                }))
              );

            if (categoriesError) {
              console.error('Error adding categories:', categoriesError);
              throw categoriesError;
            }
          }

          // Add keywords
          if (item.keywords.length > 0) {
            console.log('Processing keywords for:', item.sku);
            // Upsert all keywords at once
            const { error: keywordsError } = await supabase
              .from('keywords')
              .upsert(
                item.keywords.map(keyword => ({ keyword })),
                { onConflict: 'keyword', ignoreDuplicates: true }
              );

            if (keywordsError) throw keywordsError;

            // Get keyword IDs
            const { data: keywordRecords, error: keywordLinksError } = await supabase
              .from('keywords')
              .select('id')
              .in('keyword', item.keywords);

            if (keywordLinksError) {
              console.error('Error getting keyword IDs:', keywordLinksError);
              throw keywordLinksError;
            }

            if (keywordRecords?.length) {
              const { error: linksError } = await supabase
                .from('design_keyword_links')
                .insert(
                  keywordRecords.map(kr => ({
                    design_id: design.id,
                    keyword_id: kr.id
                  }))
                );

              if (linksError) {
                console.error('Error creating keyword links:', linksError);
                throw linksError;
              }
            }
          }

          console.log('Successfully processed:', item.sku);
          results.push({ success: true });
        } catch (error) {
          console.error('Error uploading item:', error);
          results.push({ success: false, error });
          
          setItems(prev => prev.map(i => 
            i === item ? {
              ...i,
              error: error.message || 'Failed to upload'
            } : i
          ));
        }
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} designs`);
        if (errorCount > 0) {
          const errors = results
            .filter(r => !r.success)
            .map(r => r.error?.message || 'Unknown error')
            .join('\n');
          console.error('Upload errors:', errors);
          toast.error(`Failed to upload ${errorCount} designs. Check console for details.`);
        }
        navigate('/dashboard');
      } else {
        toast.error('Failed to upload any designs');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload designs');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          Please log in to access this page.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Upload with AI</h2>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value as 'white' | 'black')}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="white">White Background</option>
              <option value="black">Black Background</option>
            </select>
            <button
              onClick={handleSaveAll}
              disabled={loading || !items.length}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload All'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Category Selection */}
          <div className="mb-8">
            <CategorySelect
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
              onCategoriesUpdate={setCategories}
            />
          </div>

          {/* File Upload */}
          <div className="mb-8">
            <div className="flex items-center justify-center w-full">
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                <UploadIcon className="w-8 h-8 mb-2" />
                <span className="text-sm">Click to upload design files</span>
                <input
                  type="file"
                  multiple
                  accept=".png,.svg"
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <div key={index} className="relative">
                <div className="aspect-square bg-gray-50 rounded-lg border overflow-hidden">
                  <img
                    src={item.preview}
                    alt="Preview"
                    className={`w-full h-full object-contain ${
                      backgroundColor === 'black' ? 'bg-black' : 'bg-white'
                    }`}
                  />
                </div>
                
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="absolute top-2 right-2 p-1 bg-red-100 rounded-full hover:bg-red-200"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>

                <div className="mt-4 space-y-4">
                  {/* Progress Indicator */}
                  {item.progress && (
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                        {item.progress.message}
                      </div>
                    </div>
                  )}

                  {/* SKU Display */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SKU
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-gray-900">{item.sku}</span>
                      {item.result?.title && (
                        <span className="text-sm text-gray-500">
                          -{item.result.title
                            .split(/[\s-]+/)
                            .slice(0, 6)
                            .map(word => word[0]?.toUpperCase() || '')
                            .join('')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => processWithAI(index)}
                    disabled={item.processing}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {item.processing ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </button>

                  {item.title && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Generated Title
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].title = e.target.value;
                          setItems(newItems);
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {item.result?.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Generated Description
                      </label>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.result.description}
                      </p>
                    </div>
                  )}

                  {item.keywords.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Generated Keywords
                      </label>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.keywords.map((keyword, kidx) => (
                          <span
                            key={kidx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.error && (
                    <p className="text-sm text-red-600">{item.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default UploadAI