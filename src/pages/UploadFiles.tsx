import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import UploadStep from '../components/upload/UploadStep';
import DetailsStep from '../components/upload/DetailsStep';
import { uploadFile, uploadMockupFile } from '../utils/fileUpload';
import type { Category } from '../types/database';

export default function UploadFiles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [printFile, setPrintFile] = useState<File | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<'white' | 'black'>('white');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [skuId, setSkuId] = useState('');
  const [skuAcronym, setSkuAcronym] = useState('');
  const [mockupFiles, setMockupFiles] = useState<File[]>([]);
  const [mockupPreviews, setMockupPreviews] = useState<string[]>([]);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Please log in to access this page.</div>
      </DashboardLayout>
    );
  }

  const handleFileSelected = (file: File) => {
    setPrintFile(file);
  };

  const handleMockupsChange = (files: File[]) => {
    setMockupFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setMockupPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveMockup = (index: number) => {
    setMockupFiles(prev => prev.filter((_, i) => i !== index));
    
    // Revoke old preview URL and remove it
    URL.revokeObjectURL(mockupPreviews[index]);
    setMockupPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printFile || selectedCategories.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const sku = `${skuId}-${skuAcronym}`;
      if (!sku) {
        toast.error('Please fill in all SKU fields');
        return;
      }

      const fileExt = printFile.name.substring(printFile.name.lastIndexOf('.'));
      const filePath = `prints/${sku}${fileExt}`;
      
      const { printUrl, webUrl } = await uploadFile(printFile, filePath, {
        backgroundColor
      });
      
      // Upload mockup files if any
      const mockupUrls = [];
      if (mockupFiles.length > 0) {
        for (const mockupFile of mockupFiles) {
          const { url, thumbUrl } = await uploadMockupFile(mockupFile, '', sku, {
            backgroundColor
          });
          mockupUrls.push({ url, thumbUrl });
        }
      }

      const { data: design, error: designError } = await supabase
        .from('design_files')
        .insert([{
          sku,
          title,
          uploaded_by: user.id,
          description,
          print_file_url: printUrl,
          web_file_url: webUrl,
        }])
        .select()
        .single();

      if (designError) throw designError;

      // Add mockups if any were uploaded
      if (mockupUrls.length > 0) {
        const { error: mockupsError } = await supabase
          .from('design_mockups')
          .insert(
            mockupUrls.map(({ url, thumbUrl }) => ({
              design_id: design.id,
              url,
              thumb_url: thumbUrl
            }))
          );

        if (mockupsError) throw mockupsError;
      }

      if (selectedCategories.length > 0) {
        const { error: categoriesError } = await supabase
          .from('design_categories')
          .insert(
            selectedCategories.map(categoryId => ({
              design_id: design.id,
              category_id: categoryId,
            }))
          );

        if (categoriesError) throw categoriesError;
      }

      if (keywords.length > 0) {
        const { data: existingKeywords, error: keywordsError } = await supabase
          .from('keywords')
          .select('id, keyword')
          .in('keyword', keywords);

        if (keywordsError) throw keywordsError;

        const existingKeywordMap = new Map(
          existingKeywords?.map(k => [k.keyword, k.id]) || []
        );

        const newKeywords = keywords.filter(k => !existingKeywordMap.has(k));
        if (newKeywords.length > 0) {
          const { data: insertedKeywords, error: insertError } = await supabase
            .from('keywords')
            .insert(newKeywords.map(keyword => ({ keyword })))
            .select('id, keyword');

          if (insertError) throw insertError;

          insertedKeywords?.forEach(k => existingKeywordMap.set(k.keyword, k.id));
        }

        const { error: linksError } = await supabase
          .from('design_keyword_links')
          .insert(
            keywords.map(keyword => ({
              design_id: design.id,
              keyword_id: existingKeywordMap.get(keyword),
            }))
          );

        if (linksError) throw linksError;
      }

      toast.success('Design uploaded successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload design');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Upload New Design</h2>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="sticky top-6">
                <UploadStep 
                  onFileSelected={handleFileSelected}
                  backgroundColor={backgroundColor}
                  onBackgroundColorChange={setBackgroundColor}
                />
              </div>
            </div>

            <div className="p-6">
              {printFile ? (
                <>
                  <DetailsStep
                    title={title}
                    description={description}
                    onTitleChange={setTitle}
                    onDescriptionChange={setDescription}
                    categories={categories}
                    selectedCategories={selectedCategories}
                    onCategoriesChange={setSelectedCategories}
                    onCategoriesUpdate={setCategories}
                    keywords={keywords}
                    onKeywordsChange={setKeywords}
                    skuId={skuId}
                    skuAcronym={skuAcronym}
                    onSkuIdChange={setSkuId}
                    onSkuAcronymChange={setSkuAcronym}
                    mockupFiles={mockupFiles}
                    onMockupsChange={handleMockupsChange}
                    mockupPreviews={mockupPreviews}
                    onRemoveMockup={handleRemoveMockup}
                  />

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? 'Uploading...' : 'Upload Design'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Please select a file to continue</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}