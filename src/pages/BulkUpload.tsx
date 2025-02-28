import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import BulkUploadPreview from '../components/upload/BulkUploadPreview';
import BulkUploadForm from '../components/upload/BulkUploadForm';
import RecentDesigns from '../components/upload/RecentDesigns';
import { getNextSkuId, generateAcronymFromFilename } from '../utils/skuGenerator';
import { uploadDesignItem } from '../utils/bulkUpload';
import type { BulkUploadItem } from '../types/upload';
import type { Category } from '../types/database';
import toast from 'react-hot-toast';

export default function BulkUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadItems, setUploadItems] = useState<BulkUploadItem[]>([]);
  const [nextId, setNextId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [backgroundColor, setBackgroundColor] = useState<'white' | 'black'>('white');
  const [mockupFiles, setMockupFiles] = useState<File[]>([]);
  const [mockupPreviews, setMockupPreviews] = useState<string[]>([]);

  useEffect(() => {
    loadNextId();
  }, []);

  const loadNextId = async () => {
    const id = await getNextSkuId();
    setNextId(id);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    let currentId = parseInt(nextId);
    const items: BulkUploadItem[] = [];

    for (const file of files) {
      const acronym = generateAcronymFromFilename(file.name);
      const sku = `${currentId}-${acronym}`;
      const title = file.name
        .substring(0, file.name.lastIndexOf('.'))
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      items.push({
        file,
        title,
        sku,
        baseTitle: title
      });

      currentId++;
    }

    setUploadItems(items);
    setNextId(currentId.toString());
  };

  const handleSaveAll = async () => {
    if (!user) {
      toast.error('Please log in to upload files');
      return;
    }

    if (!uploadItems.length) {
      toast.error('Please select files to upload');
      return;
    }

    if (!selectedCategories.length) {
      toast.error('Please select at least one category');
      return;
    }

    setLoading(true);
    const results = [];

    try {
      for (const item of uploadItems) {
        // Upload main design file
        const result = await uploadDesignItem(item, user.id, {
          backgroundColor,
          selectedCategories,
          keywords,
          description,
          mockupFiles
        });
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} designs`);
        if (errorCount > 0) {
          toast.error(`Failed to upload ${errorCount} designs`);
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
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Bulk Upload</h2>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <BulkUploadForm
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
                description={description}
                onDescriptionChange={setDescription}
                categories={categories}
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                onCategoriesUpdate={setCategories}
                keywords={keywords}
                onKeywordsChange={setKeywords}
                mockupFiles={mockupFiles}
                onMockupsChange={(files) => {
                  setMockupFiles(prev => [...prev, ...files]);
                  const newPreviews = files.map(f => URL.createObjectURL(f));
                  setMockupPreviews(prev => [...prev, ...newPreviews]);
                }}
                mockupPreviews={mockupPreviews}
                onRemoveMockup={(index) => {
                  setMockupFiles(prev => prev.filter((_, i) => i !== index));
                  URL.revokeObjectURL(mockupPreviews[index]);
                  setMockupPreviews(prev => prev.filter((_, i) => i !== index));
                }}
                onFilesSelected={handleFilesSelected}
              />
            </div>

            <div>
              <RecentDesigns />
            </div>
          </div>

          <BulkUploadPreview
            items={uploadItems}
            onItemUpdate={(index, item) => {
              const newItems = [...uploadItems];
              newItems[index] = item;
              setUploadItems(newItems);
            }}
            onItemRemove={(index) => {
              setUploadItems(items => items.filter((_, i) => i !== index));
            }}
            onSaveAll={handleSaveAll}
            loading={loading}
            backgroundColor={backgroundColor}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}